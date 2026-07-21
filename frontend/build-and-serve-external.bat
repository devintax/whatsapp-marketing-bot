@echo off
echo Building for external domain with HTTPS support...
set REACT_APP_API_URL=https://api.vemgootech.info
set GENERATE_SOURCEMAP=false
npm run build
echo Build complete! Starting production server...
node server-external.js