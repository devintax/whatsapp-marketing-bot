@echo off
echo ========================================
echo Git Commit: WhatsApp Troubleshooting Updates
echo ========================================
echo.

cd /d "%~dp0"

echo Adding files to git...
git add frontend/src/pages/ProTips.js
git add WHATSAPP_TROUBLESHOOTING_GUIDE.md
git add backend/fix-whatsapp-connection.js
git add clean-whatsapp-sessions.bat
git add backend/test-personalization.js

echo.
echo Files staged. Status:
git status --short

echo.
echo Committing changes...
git commit -m "docs: WhatsApp Connection Troubleshooting Guide + Pro Tips Update

DOCUMENTATION & TROUBLESHOOTING TOOLS:
✅ Comprehensive WhatsApp troubleshooting guide (WHATSAPP_TROUBLESHOOTING_GUIDE.md)
✅ Pro Tips page updated with WhatsApp Connection section
✅ Session cleanup tools (clean-whatsapp-sessions.bat, fix-whatsapp-connection.js)
✅ Personalization test script (test-personalization.js)

NEW PRO TIPS SECTION - WhatsApp Connection Setup:
- First-Time Connection Guide (step-by-step)
- Fix 'Couldn't Link Device' Error
- Fix 'Status: Restoring' Stuck
- Maintain Stable Connection
- Test Connection Before Campaigns

TROUBLESHOOTING GUIDE INCLUDES:
- Complete setup walkthrough
- Common error solutions (QR code, JWT token, port conflicts)
- Expected console logs
- Best practices (DO/DON'T lists)
- Quick reset checklist
- Advanced troubleshooting

TOOLS CREATED:
- clean-whatsapp-sessions.bat: One-click session cleanup
- fix-whatsapp-connection.js: Automated session file removal
- test-personalization.js: Verify message personalization logic

FIXES USER ISSUES:
🔧 'Couldn't link device' error when scanning QR
🔧 JWT token expired errors
🔧 Status stuck in 'Restoring' mode
🔧 Port conflicts (EADDRINUSE)

IMPACT:
📚 Users can self-troubleshoot WhatsApp connection issues
📚 Reduced support burden with comprehensive guides
📚 Clear visual step-by-step instructions
📚 Automated cleanup tools for common problems"

echo.
echo Pushing to GitHub...
git push

echo.
echo ========================================
echo ✅ Changes committed and pushed to GitHub!
echo ========================================
echo.
pause
