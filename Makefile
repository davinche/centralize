.PHONY: build patch minor major publish

build: node_modules
	npm start

node_modules: package.json package-lock.json
	npm install

patch: node_modules
	npm version patch

minor: node_modules
	npm version minor

major: node_modules
	npm version major

publish: build
	npm publish
