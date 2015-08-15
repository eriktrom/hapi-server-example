# Test
test:
	@node node_modules/lab/bin/lab --colors -a code

# Test on save
auto-test:
	@nodemon node_modules/lab/bin/lab --colors -a code -t 100 -Lv

# Test with coverage
test-cov:
	@node node_modules/lab/bin/lab --colors -a code -t 100 -Lv

# Test with coverage reported to html
test-cov-html:
	@node node_modules/lab/bin/lab --colors -a code -r html -o coverage.html

# Start the application
start:
	@node lib/start.js

# Start the application, then restart on file file save, for dev use only
# not for use when an unhandled exception crashes the app!
auto-start:
	@nodemon lib/start.js


.PHONY: test start test-cov auto-test-cov auto-start test-cov-html
