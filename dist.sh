rm -rf TooNote-darwin-x64/TooNote.app
cd src
npm run build
cd ..
mkdir tmp
mv src/{api,component,modules,vuex,*.map} tmp
electron-packager src TooNote \
	--platform=darwin \
	--arch=x64 --version=1.3.8 \
	--overwrite \
	--app-version=0.2.0 \
	--icon=./logo/logo-new.icns \
	# --ignore="(api\\\\(menu|store)\\\\[\\w]+|component\\\\[\\w]+\\.vue|modules\\\\[\\w]+|vuex\\\\store)"
mv tmp/* src
rm -rf tmp
