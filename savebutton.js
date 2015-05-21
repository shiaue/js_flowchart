$('#savebtn').click(function() {
   var saveit = $('#calendar').fullCalendar('clientEvents');

   var eventsholded = [];

   $.each(saveit, function(index, value) {
    var event = new Object();
    event.id = value.id;
    event.start = value.start;
    event.end = value.end;
    event.title = value.title;
    event.allDay = value.allDay
    eventsholded.push(event);
   });
   $.ajax({
    type: "GET",
    dataType: 'json',
    async: false,
    url: 'general.json',
    data: JSON.stringify(eventsholded),
    success: function() {
     alert("Thanks!");
    },
    failure: function() {
     alert("Error!");
    }
   });
});
