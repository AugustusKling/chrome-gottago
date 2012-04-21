// Set up application API and web service end-point
var gottaGo = new GottaGo(function requery(){
	$.ajax({
		url: 'http://busstop.ch.azdev.nine.ch/gottago_status/' + encodeURIComponent(localStorage.device_identifier),
		dataType: 'json'
	}).done(gottaGo.parseResponse).fail(gottaGo.handleRequestError);
});

// Change toolbar icon to show status
gottaGo.bind('go', function(){
	chrome.browserAction.setIcon({
		path: "button_ok.png"
	});
}).bind('no_go', function(){
	chrome.browserAction.setIcon({
		path: "button_cancel.png"
	});
}).bind('off', function(){
	chrome.browserAction.setIcon({
		path: "configure.png"
	});
}).bind('error', function(event, message){
	chrome.browserAction.setIcon({
		path: "underconstruction.png"
	});
});

// If the user configured the device already request status, otherwise show hint how to configure
if(localStorage.device_identifier){
	gottaGo.query();
} else {
	var notification = webkitNotifications.createNotification(
		'gottago48.png',
		'GottaGo Configuration Incomplete',  // notification title
		'Please click the icon in the toolbar to configure GottaGo.'  // notification body text
	);
	notification.show();
	
	setTimeout(function(){
		notification.cancel();
	}, 10e3);
}