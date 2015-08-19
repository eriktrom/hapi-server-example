## Note that was all over code base and im sick of seeing

/**
Code inside the callback function of server.dependency will only be executed
after AuthCookie plugin has been registered.

It's triggered by server.start, and runs before actual starting of the server.

It's done because the call to server.route upon registration with
auth:'cookie' config would fail and make the server crash if the basic
strategy is not previously registered by Auth.
 */
