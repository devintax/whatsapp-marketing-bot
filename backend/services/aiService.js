const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const { Groq } = require('groq-sdk');

class AIService {
  constructor() {
    // Initialize OpenAI clients with multiple keys for load balancing (only valid keys)
    this.openaiClients = [];
    
    const openaiKeys = [
      process.env.OPENAI_API_KEY,
      process.env.OPENAI_API_KEY_2,
      process.env.OPENAI_API_KEY_3,
      process.env.OPENAI_API_KEY_4
    ].filter(key => key && key.startsWith('sk-') && key.length > 20);

    // Only initialize OpenAI clients if we have valid API keys
    for (const key of openaiKeys) {
      try {
        this.openaiClients.push(new OpenAI({ apiKey: key }));
      } catch (error) {
        console.warn(`Failed to initialize OpenAI client with key: ${key.substring(0, 10)}...`);
      }
    }

    // Initialize other AI providers
    this.groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
    this.gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
    this.claude = process.env.CLAUDE_API_KEY ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY }) : null;
    this.localLlm = process.env.LOCAL_LLM_BASE_URL ? new OpenAI({
      apiKey: process.env.LOCAL_LLM_API_KEY || 'local-llm',
      baseURL: process.env.LOCAL_LLM_BASE_URL
    }) : null;
    this.openRouter = process.env.OPENROUTER_API_KEY ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'WhatsApp Marketing Bot'
      }
    }) : null;

    this.currentOpenAIIndex = 0;
    this.primaryModel = process.env.PRIMARY_AI_MODEL || 'local_llm';
    this.fallbackModel = process.env.FALLBACK_AI_MODEL || 'openrouter';
    this.modelRotation = process.env.AI_MODEL_ROTATION === 'true';
  }

  // Get next OpenAI client for load balancing
  getNextOpenAIClient() {
    const client = this.openaiClients[this.currentOpenAIIndex];
    this.currentOpenAIIndex = (this.currentOpenAIIndex + 1) % this.openaiClients.length;
    return client;
  }

  // Generate text using specified provider
  async generateText(prompt, options = {}) {
    const {
      provider = this.primaryModel,
      model = this.getDefaultModel(provider),
      maxTokens = 1000,
      temperature = 0.7,
      systemPrompt = null
    } = options;

    try {
      switch (provider) {
        case 'local_llm':
          return await this.generateWithOpenAICompatible(this.localLlm, 'local_llm', prompt, {
            model,
            maxTokens,
            temperature,
            systemPrompt
          });

        case 'openrouter':
          return await this.generateWithOpenAICompatible(this.openRouter, 'openrouter', prompt, {
            model,
            maxTokens,
            temperature,
            systemPrompt
          });

        case 'openai':
          return await this.generateWithOpenAI(prompt, { model, maxTokens, temperature, systemPrompt });
        
        case 'groq':
          console.log('Using Groq with model: llama-3.1-8b-instant');
          return await this.generateWithGroq(prompt, { model: 'llama-3.1-8b-instant', maxTokens, temperature, systemPrompt });
        
        case 'gemini':
          return await this.generateWithGemini(prompt, { model: 'gemini-pro', maxTokens, temperature, systemPrompt });
        
        case 'claude':
          return await this.generateWithClaude(prompt, { model: 'claude-3-sonnet-20240229', maxTokens, temperature, systemPrompt });
        
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error with ${provider}:`, error.message);
      
      // Try fallback provider if primary fails
      if (provider !== this.fallbackModel) {
        console.log(`Falling back to ${this.fallbackModel}...`);
        // Force working model for Groq fallback
        const fallbackOptions = { ...options, provider: this.fallbackModel };
        if (this.fallbackModel === 'groq') {
          fallbackOptions.model = 'llama-3.1-8b-instant';
        }
        return await this.generateText(prompt, fallbackOptions);
      }
      
      throw error;
    }
  }

  getDefaultModel(provider) {
    const defaults = {
      local_llm: process.env.LOCAL_LLM_MODEL || 'llama3.1:8b',
      openrouter: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      openai: process.env.OPENAI_MODEL || 'gpt-4',
      groq: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      gemini: process.env.GEMINI_MODEL || 'gemini-pro',
      claude: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229'
    };

    return defaults[provider] || defaults.local_llm;
  }

  async generateWithOpenAI(prompt, options) {
    if (this.openaiClients.length === 0) throw new Error('OpenAI API key not configured');

    const client = this.getNextOpenAIClient();
    const messages = [];
    
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const completion = await client.chat.completions.create({
      model: options.model,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature
    });

    return {
      text: completion.choices[0].message.content,
      provider: 'openai',
      model: options.model,
      usage: completion.usage
    };
  }

  async generateWithOpenAICompatible(client, provider, prompt, options) {
    if (!client) throw new Error(`${provider} is not configured`);

    const messages = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await client.chat.completions.create({
      model: options.model,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature
    });

    return {
      text: completion.choices[0].message.content,
      provider,
      model: options.model,
      usage: completion.usage
    };
  }

  async generateWithGroq(prompt, options) {
    if (!this.groq) throw new Error('Groq API key not configured');

    const messages = [];
    
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // Force the working model
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature
    });

    return {
      text: completion.choices[0].message.content,
      provider: 'groq',
      model: options.model,
      usage: completion.usage
    };
  }

  async generateWithGemini(prompt, options) {
    if (!this.gemini) throw new Error('Gemini API key not configured');

    const model = this.gemini.getGenerativeModel({ model: options.model });
    
    const fullPrompt = options.systemPrompt 
      ? `${options.systemPrompt}\n\nUser: ${prompt}` 
      : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;

    return {
      text: response.text(),
      provider: 'gemini',
      model: options.model,
      usage: {
        prompt_tokens: 0, // Gemini doesn't provide token usage
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  async generateWithClaude(prompt, options) {
    if (!this.claude) throw new Error('Claude API key not configured');

    const messages = [{ role: 'user', content: prompt }];

    const completion = await this.claude.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: options.systemPrompt,
      messages
    });

    return {
      text: completion.content[0].text,
      provider: 'claude',
      model: options.model,
      usage: completion.usage
    };
  }

  // Generate campaign content with business context
  async generateCampaign(prompt, businessContext, options = {}) {
    const systemPrompt = `You are an expert marketing campaign designer for WhatsApp marketing. 
    
    Business Context:
    ${businessContext}
    
    Create a compelling marketing message that:
    1. Is mobile-friendly and WhatsApp appropriate
    2. Includes clear call-to-actions
    3. Is personalized to the business
    4. Follows marketing best practices
    5. Is engaging and conversion-focused
    
    The output should be formatted as JSON with the following structure:
    {
      "text": "The main message text",
      "structure": {
        "header": "Eye-catching headline",
        "body": "Main message content",
        "cta": "Call to action",
        "contact": "Contact information"
      },
      "mediaRecommendations": ["image", "video", "document"],
      "targetingTips": ["audience insight 1", "audience insight 2"]
    }`;

    return await this.generateText(prompt, {
      provider: options.provider || this.primaryModel,
      systemPrompt,
      maxTokens: 1200
    });
  }

  // Extract business insights
  async extractBusinessInsights(content, dataType, options = {}) {
    const prompt = `Analyze this business ${dataType} content and provide marketing insights:
    
    Content: ${content}
    
    Provide insights in JSON format:
    {
      "keywords": ["relevant", "marketing", "keywords"],
      "targetAudience": "Description of ideal target audience",
      "messageRecommendations": ["suggestion 1", "suggestion 2"],
      "campaignIdeas": ["idea 1", "idea 2"]
    }`;

    return await this.generateText(prompt, {
      ...options,
      maxTokens: 600,
      temperature: 0.6
    });
  }

  // Optimize campaign content
  async optimizeCampaign(currentContent, feedback, options = {}) {
    const prompt = `Current campaign content: ${currentContent}
    
    User feedback: ${feedback}
    
    Please optimize this campaign content based on the feedback while maintaining the core message and business context.
    Return the same JSON structure as the original.`;

    return await this.generateText(prompt, {
      ...options,
      maxTokens: 1000,
      temperature: 0.5
    });
  }

  // Get available providers
  getAvailableProviders() {
    const providers = [];
    
    if (this.openaiClients.length > 0) providers.push('openai');
    if (this.localLlm) providers.push('local_llm');
    if (this.openRouter) providers.push('openrouter');
    if (this.groq) providers.push('groq');
    if (this.gemini) providers.push('gemini');
    if (this.claude) providers.push('claude');
    
    return providers;
  }

  // Health check for all providers
  async healthCheck() {
    const providers = this.getAvailableProviders();
    const results = {};

    for (const provider of providers) {
      try {
        const testPrompt = 'Say "OK" if you can respond.';
        const result = await this.generateText(testPrompt, { 
          provider, 
          maxTokens: 10,
          temperature: 0 
        });
        results[provider] = { status: 'healthy', response: result.text };
      } catch (error) {
        results[provider] = { status: 'error', error: error.message };
      }
    }

    return results;
  }

  // Generate business insights for AI training
  async generateBusinessInsights(prompt, options = {}) {
    const enhancedPrompt = `${prompt}

Please analyze this business data and extract key insights that will help in creating effective marketing campaigns. Focus on:
1. Target audience characteristics
2. Key value propositions  
3. Communication style and tone
4. Competitive advantages
5. Main products/services offerings

Provide structured insights that can be used for campaign personalization.`;

    const result = await this.generateText(enhancedPrompt, {
      ...options,
      maxTokens: options.maxTokens || 1500,
      temperature: options.temperature || 0.3
    });

    return {
      insights: result.text,
      provider: result.provider,
      model: result.model,
      usage: result.usage
    };
  }
}

module.exports = new AIService();
