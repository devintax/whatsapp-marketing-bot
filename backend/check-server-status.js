/**
 * Quick Server Status Check
 * Verifies all servers are running after restart
 */

const axios = require('axios');

async function checkServerStatus() {
    console.log('🔍 CHECKING SERVER STATUS AFTER RESTART');
    console.log('═'.repeat(50));
    
    const services = [
        {
            name: 'Backend API',
            url: 'http://localhost:5000/api/auth/me',
            expected: [401, 200] // 401 is expected (no auth token)
        },
        {
            name: 'Frontend Local',
            url: 'http://localhost:8080',
            expected: [200]
        },
        {
            name: 'External Domain',
            url: 'https://connect.vemgootech.info',
            expected: [200]
        },
        {
            name: 'External API',
            url: 'https://connect.vemgootech.info/api/auth/me',
            expected: [401, 200] // 401 is expected (no auth token)
        },
        {
            name: 'Dashboard Route (SPA Test)',
            url: 'https://connect.vemgootech.info/dashboard',
            expected: [200] // Should work with SPA routing fix
        }
    ];
    
    console.log(`🕒 Testing ${services.length} services...`);
    
    for (const service of services) {
        try {
            const response = await axios.get(service.url, {
                timeout: 10000,
                validateStatus: (status) => status < 500
            });
            
            const status = response.status;
            const isExpected = service.expected.includes(status);
            const icon = isExpected ? '✅' : '⚠️';
            
            console.log(`${icon} ${service.name}: ${status} ${isExpected ? '(Expected)' : '(Unexpected)'}`);
            
            if (service.name === 'Dashboard Route (SPA Test)' && status === 200) {
                console.log('   🎉 SPA routing fix is working!');
            }
            
        } catch (error) {
            const status = error.response?.status || 'Network Error';
            console.log(`❌ ${service.name}: ${status} (${error.message})`);
            
            if (error.code === 'ECONNREFUSED') {
                console.log(`   💡 Service not yet started or port not available`);
            }
        }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('━'.repeat(20));
    console.log('✅ = Service running correctly');
    console.log('⚠️ = Unexpected status (may still be starting)');
    console.log('❌ = Service not accessible');
    
    console.log('\n⏰ If services show errors, wait 1-2 minutes for startup');
    console.log('🔄 Tunnel and frontend may take time to fully initialize');
}

checkServerStatus().catch(console.error);