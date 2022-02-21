echo "Erasing and rebuilding all npm packages ..."
echo "Installing qpools-sdk ..."
cd ./qpools-sdk
rm -rf node_modules/
rm -rf lib/
rm package-lock.json
rm yarn.lock
npm install --include=dev
tsc

cd ..
echo "Installing qpools-admin-sdk ..."
cd ./qpools-admin-sdk
rm -rf node_modules/
rm -rf lib/
rm package-lock.json
rm yarn.lock
npm install --include=dev
tsc

cd ..
echo "Installing solbond ..."
cd ./solbond
rm -rf node_modules/
rm package-lock.json
rm yarn.lock
npm install --include=dev

echo "Success!"
