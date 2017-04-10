rm -rf TooNote-darwin-x64/TooNote.app
cd src
npm run build
cd ..
mkdir tmp
mv src/{api,component,modules,models,vuex,*.map} tmp
ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/ electron-packager src TooNote \
	--platform=darwin \
	--arch=x64 --version=1.3.8 \
	--overwrite \
	--app-version=0.3.0 \
	--icon=./logo/logo-new.icns \
	# --ignore="(api\\\\(menu|store)\\\\[\\w]+|component\\\\[\\w]+\\.vue|modules\\\\[\\w]+|vuex\\\\store)"
mv tmp/* src
rm -rf tmp
