PROJECT_NAME ?= tabtune
DIST_DIR ?= dist
PACKAGE_DIR ?= artifacts
NPM ?= npm
ZIP ?= zip
VERSION ?= $(shell node -p "JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version")
PACKAGE_FILE ?= $(PACKAGE_DIR)/$(PROJECT_NAME)-$(VERSION).zip

.DEFAULT_GOAL := help

.PHONY: all help deps build pack install clean

all: build

help:
	@printf '%s\n' \
		'make deps    Install Node.js dependencies with npm ci' \
		'make build   Build the unpacked Chrome extension into dist/' \
		'make pack    Build and create a versioned ZIP in $(PACKAGE_DIR)/' \
		'make install Install dependencies, build, and package the extension' \
		'make clean   Remove generated build and package files'

deps:
	$(NPM) ci

build:
	$(NPM) run build

pack: build
	@command -v $(ZIP) >/dev/null 2>&1 || (printf '%s\n' 'Error: zip is required to package the extension.' >&2; exit 1)
	@mkdir -p $(PACKAGE_DIR)
	@rm -f $(PACKAGE_FILE)
	@cd $(DIST_DIR) && $(ZIP) -qr $(abspath $(PACKAGE_FILE)) .
	@printf 'Created %s\n' '$(PACKAGE_FILE)'

install: deps pack
	@printf '%s\n' \
		'Extension package is ready.' \
		'Open chrome://extensions, enable Developer mode, choose Load unpacked,' \
		'and select $(DIST_DIR)/.' \
		'Package for distribution: $(PACKAGE_FILE)'

clean:
	$(NPM) run clean
	@rm -rf $(PACKAGE_DIR)
