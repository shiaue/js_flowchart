$(function() {
    // State chart
    // socket.io practice
    //myJson = require("./sample.json");

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: $('#paper'),
        width: $(window).width(),
        height: $(window).height(),
        gridSize: 1,
        model: graph
    });


    //var uml = joint.shapes.uml;

    //var states = {
    //
    //    s0: new uml.StartState({
    //        position: { x:20  , y: 20 },
    //        size: { width: 30, height: 30 }
    //    }),
    //
    //    s1: new uml.State({
    //        position: { x:100  , y: 100 },
    //        size: { width: 200, height: 100 },
    //        name: "state 1",
    //        events: ["entry / init()","exit / destroy()"]
    //    }),
    //
    //    s2: new uml.State({
    //        position: { x:400  , y: 200 },
    //        size: { width: 300, height: 300 },
    //        name: "state 2",
    //        events: ["entry / create()","exit / kill()","A / foo()","B / bar()"]
    //    }),
    //
    //    s3: new uml.State({
    //        position: { x:130  , y: 400 },
    //        size: { width: 160, height: 60 },
    //        name: "state 3",
    //        events: ["entry / create()","exit / kill()"]
    //    }),
    //
    //    s4: new uml.State({
    //        position: { x:530  , y: 400 },
    //        size: { width: 160, height: 50 },
    //        name: "sub state 4",
    //        events: ["entry / create()"]
    //    }),
    //
    //    se: new uml.EndState({
    //        position: { x:750  , y: 550 },
    //        size: { width: 30, height: 30 }
    //    })
    //
    //};

    // Create a custom element.
// ------------------------

    joint.shapes.html = {};
    joint.shapes.html.Element = joint.shapes.basic.Rect.extend({
        defaults: joint.util.deepSupplement({
            type: 'html.Element',
            attrs: {
                rect: { stroke: 'none', 'fill-opacity': 0 }
            }
        }, joint.shapes.basic.Rect.prototype.defaults)
    });

// Create a custom view for that element that displays an HTML div above it.
// -------------------------------------------------------------------------

    joint.shapes.html.ElementView = joint.dia.ElementView.extend({

        template: [
            '<div class="html-element">',
            '<button class="delete">x</button>',
            '<label></label>',
            '<span></span>', '<br/>',
            //Different processes
            '<select><option>--</option><option>Manufacturing Process</option><option>Design Process</option></select>',
            '<input type="text" placeholder="Enter description here" />',
            '</div>'
        ].join(''),

        initialize: function() {
            _.bindAll(this, 'updateBox');
            joint.dia.ElementView.prototype.initialize.apply(this, arguments);

            this.$box = $(_.template(this.template)());
            // Prevent paper from handling pointerdown.
            this.$box.find('input,select').on('mousedown click', function(evt) { evt.stopPropagation(); });
            // This is an example of reacting on the input change and storing the input data in the cell model.
            this.$box.find('input').on('change', _.bind(function(evt) {
                this.model.set('input', $(evt.target).val());
            }, this));
            this.$box.find('select').on('change', _.bind(function(evt) {
                this.model.set('select', $(evt.target).val());
            }, this));
            this.$box.find('select').val(this.model.get('select'));
            this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));
            // Update the box position whenever the underlying model changes.
            this.model.on('change', this.updateBox, this);
            // Remove the box when the model gets removed from the graph.
            this.model.on('remove', this.removeBox, this);

            this.updateBox();
        },
        render: function() {
            joint.dia.ElementView.prototype.render.apply(this, arguments);
            this.paper.$el.prepend(this.$box);
            this.updateBox();
            return this;
        },
        updateBox: function() {
            // Set the position and dimension of the box so that it covers the JointJS element.
            var bbox = this.model.getBBox();
            // Example of updating the HTML with a data stored in the cell model.
            this.$box.find('label').text(this.model.get('label'));
            this.$box.find('span').text(this.model.get('select'));
            this.$box.css({ width: bbox.width, height: bbox.height, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
        },
        removeBox: function(evt) {
            this.$box.remove();
        }
    });

// Create JointJS elements and add them to the graph as usual.
// -----------------------------------------------------------

    var el1 = new joint.shapes.html.Element({ position: { x: 80, y: 80 }, size: { width: 170, height: 100 }, label: 'Process 1', select: 'one' });
    var el2 = new joint.shapes.html.Element({ position: { x: 370, y: 160 }, size: { width: 170, height: 100 }, label: 'Process 2', select: 'two' });
    var l = new joint.dia.Link({
        source: { id: el1.id },
        target: { id: el2.id },
        attrs: { '.connection': { 'stroke-width': 5, stroke: '#34495E' } }
    });

    graph.addCells([el1, el2, l]);

    //graph.addCells(states);
    //
    //states.s2.embed(states.s4);
    //
    //var transitions = [
    //    new uml.Transition({ source: { id: states.s0.id }, target: { id: states.s1.id }}),
    //    new uml.Transition({ source: { id: states.s1.id }, target: { id: states.s2.id }}),
    //    new uml.Transition({ source: { id: states.s1.id }, target: { id: states.s3.id }}),
    //    new uml.Transition({ source: { id: states.s3.id }, target: { id: states.s4.id }}),
    //    new uml.Transition({ source: { id: states.s2.id }, target: { id: states.se.id }})
    //];
    //
    //graph.addCells(transitions);

// write to JSON
//
//    var fs = require('fs');
//    graph.toJSON();
//    myJson = JSON.stringify(graph);

    // Cannot use "require('module_name');" on the client side


    var socket = io.connect('http://localhost:3000');
    var $form = $('#send-message');
    var $box = $('#message');
    var $chat = $('#chat');



    //$form.submit(function(event)   {
    //    event.preventDefault();
    //    socket.emit('send message', $box.val());
    //    $box.val('');
    //    // event name = 'send message'
    //});



    socket.on('greeting' ,function(data)  {
        console.log(data);
        console.log('message connection opened');
    });

    // sends message on click
    $('#save').click(function(event) {
        event.preventDefault();

        graph.toJSON();
        var graphTitle = $box.val();
        socket.emit('setting title', $box.val());
        console.log('button click, message sending... ');

        socket.emit('sendGraph', { mGraph: graph, title: graphTitle });

        var graphJson = JSON.stringify(graph);
        socket.emit('sendGraphJson', { mGraph: graph, title: graphTitle });



    });

    // response for a new message
    socket.on('new message', function (data) {
        graph.toJSON();
        var graphJson = JSON.stringify(graph);
        console.log('Title set as: ' + data);

        //$chat.append(graphJson);
    });

    socket.on('successful_save', function(data) {
        console.log(data);
    });




        //$.ajax({
        //    type: "POST",
        //    dataType: 'json',
        //    url: 'save_json.php',
        //    data: { data: graphJson },
        //    success: function () {
        //        alert("SAVED!");
        //        console.log("Saved JSON");
        //    },
        //    failure: function() {alert("Error!");}
        //});


    //var myCallback = function (err) {
    //    if (err)
    //        return console.log(err + 'error with fs.write');
    //};
    //
    //fs.writeFile( "sample.json", myJson, "utf8", myCallback() );

});