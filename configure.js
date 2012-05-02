$(document).ready(function(){
	// Get references to global scope of background page (running application) and display
	var background = chrome.extension.getBackgroundPage();
	var status_indicator = $('#status_indicator');

	/**
     * Restores the original state of the status indicator (neutral style, empty and hidden)
     * @return jQuery Wrapped status indicator element
     */
    status_indicator.reset = function(){
        return this.text('').removeClass().hide();
    };

	// Bind handlers to display status to user in popup window
	background.gottaGo.bind('go', function(){
		status_indicator.reset().addClass('go').text("Jetzt gehen.").show();
	}).bind('no_go', function(){
		status_indicator.reset().addClass('no_go').text("Zu spät.").show();
	}).bind('off', function(event, json){
		var minutesUntilGo = Math.round(json.status_changes.go/60);
		status_indicator.reset().addClass('off').text(" Noch "+minutesUntilGo+" Minuten.").show();
	}).bind('error', function(event, message){
		status_indicator.reset().addClass('error').text(message).show();
	});

	// Issue request when user clicks the button
	$('form').submit(function(e){
		var form = $(this);

		e.preventDefault();

		localStorage.gottago_key = $('input[name="gottago_key"]').val();

		background.gottaGo.query();
	});

	// Fill in default value
	var gottago_key = localStorage.gottago_key || '';
	$('input[name="gottago_key"]').val(gottago_key);

	// Issue request and display current status when user opens popup
	if(gottago_key){
		$('form').submit();
	}
});