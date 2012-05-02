/**
 * Scheduler that allows abortion of scheduled tasks
 */
function Scheduler(){
    /**
     * List of pending or executed timeout handles
     * @type Array.<Integer>
     */
    var timeouts = [];

    /**
     * Aborts all running timeouts
     */
    this.clearAll = function(){
        $.each(timeouts, function(index, timeout){
            // Abort timeout
            clearTimeout(timeout);
        });
        timeouts = [];
    };

    /**
     * Schedules a function for later execution and keeps a handle for abortion.
     * @param {Function} callback Delayed function
     * @param {Number} milliseconds Amount of time to delay execution
     */
    this.schedule = function(callback, milliseconds){
        timeouts.push(setTimeout(callback, milliseconds));
    };
}

/**
 * Handler for web service's JSON protocol. Shows status messages and errors.
 * @param {Function} query_service Callback to query web service again
 */
function GottaGo(query_service){
	var self = jQuery(this);
    var timeouts = new Scheduler();
    var error_messages = {
        no_api: "Statusinformation currently not available. Please try again later.",
        not_configured: "This key is not yet configured. Please go to gottago.ch and create a key.",
        no_data: "There are no data available for this key."
    };

	// TODO Unused handler code that will be brought back to life when web service is back for testing
    var status_handlers = {
        off: function handle_off(json){
            if(!isNaN(json.status_changes.go)) {
                var minutesUntilGo = Math.round(json.status_changes.go/60);

                // Always show correct relative time
                if(minutesUntilGo>1){
                    var updatedStatusChanges = $.extend({}, json.status_changes, {go:json.status_changes.go-60});
                    var updatedJson = $.extend({}, json, {status_changes: updatedStatusChanges});
                    timeouts.schedule(function(){
                        status_handlers.off(updatedJson);
                    }, 60*1000);
                }
            }
        }
    };

    /**
     * Interprets the web service's response and displays status.
     */
    this.parseResponse = function parse(json){
        timeouts.clearAll();
        if(json.constructor!==({}).constructor){
            self.trigger('error', "Wrong data from the server");
            return;
        }

        if(json.error){
            self.trigger('error', error_messages[json.error] || "Unknown error")
        } else {
            // Render current status
            self.trigger(json.status, json);

            $.each(['go', 'no_go', 'off'], function(index, status){
                var delay = json.status_changes[status];
                if(!isNaN(delay)){
                    // Schedule status changes for future states
                    timeouts.schedule(function(){
						self.trigger(status, json);
                    }, delay*1000);
                }
            });
        }

        // Schedule another request to the server
        timeouts.schedule(query_service, (json.next_refresh||60)*1000);
    };

    this.handleRequestError = function(){
        self.trigger('error', "Server not reachable");

        timeouts.clearAll();
        // Try again in 1min and hope service is up again
        timeouts.schedule(query_service, 60*1000);
    };

	/**
	 * Queries the server for the status
	 */
	this.query = query_service;

	/**
	 * Registers an event handler for status changes or error notifications
	 * @param {String} event Name of event: go, no_go, off, error
	 * @param {Function} handler Function to execute in case of event
	 */
	this.bind = function(event, handler){
		self.bind(event, handler);
		return this;
	}
}
