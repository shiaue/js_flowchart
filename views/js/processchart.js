$(function() {

    //myJson = require("./sample.json");

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: $('#paper'),
        width: $(window).width(),
        height: $(window).height(),
        gridSize: 1,
        model: graph
    });


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

//  Different processes are listed here
// -------------------------------------
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

// Create JointJS elements and add them to the graph
// -----------------------------------------------------------

    var el1 = new joint.shapes.html.Element({ position: { x: 580, y: 80 }, size: { width: 200, height: 110 }, label: 'A', select: 'Process' });
    var el2 = new joint.shapes.html.Element({ position: { x: 370, y: 160 }, size: { width: 200, height: 110 }, label: 'B', select: 'Process' });
    var l = new joint.dia.Link({
        source: { id: el1.id },
        target: { id: el2.id },
        attrs: {
            '.marker-source': {
                d: 'M 10 0 L 0 5 L 10 10 z'
            },
            '.connection': { 'stroke-width': 3, stroke: '#000000' },
        },
        connector: { name: 'smooth' }
    });

    //l.set('connector', { name: 'smooth' });
    var newRect = new joint.shapes.html.Element({
        position: { x: 10, y: 150 },
        size: { width: 200, height: 110 },
        label: 'Process 1', select: 'one' });




    graph.addCells([newRect, el1, el2, l]);


    //This function allows multiple vertices to readjust when shapes are moved
    function adjustVertices(graph, cell) {

        // If the cell is a view, find its model.
        cell = cell.model || cell;

        if (cell instanceof joint.dia.Element) {

            _.chain(graph.getConnectedLinks(cell)).groupBy(function(link) {
                // the key of the group is the model id of the link's source or target, but not our cell id.
                return _.omit([link.get('source').id, link.get('target').id], cell.id)[0];
            }).each(function(group, key) {
                // If the member of the group has both source and target model adjust vertices.
                if (key !== 'undefined') adjustVertices(graph, _.first(group));
            });

            return;
        }

        // The cell is a link. Let's find its source and target models.
        var srcId = cell.get('source').id || cell.previous('source').id;
        var trgId = cell.get('target').id || cell.previous('target').id;

        // If one of the ends is not a model, the link has no siblings.
        if (!srcId || !trgId) return;

        var siblings = _.filter(graph.getLinks(), function(sibling) {

            var _srcId = sibling.get('source').id;
            var _trgId = sibling.get('target').id;

            return (_srcId === srcId && _trgId === trgId) || (_srcId === trgId && _trgId === srcId);
        });

        switch (siblings.length) {

            case 0:
                // The link was removed and had no siblings.
                break;

            case 1:
                // There is only one link between the source and target. No vertices needed.
                cell.unset('vertices');
                break;

            default:

                // There is more than one siblings. We need to create vertices.

                // First of all we'll find the middle point of the link.
                var srcCenter = graph.getCell(srcId).getBBox().center();
                var trgCenter = graph.getCell(trgId).getBBox().center();
                var midPoint = g.line(srcCenter, trgCenter).midpoint();

                // Then find the angle it forms.
                var theta = srcCenter.theta(trgCenter);

                // This is the maximum distance between links
                var gap = 20;

                _.each(siblings, function(sibling, index) {

                    // We want the offset values to be calculated as follows 0, 20, 20, 40, 40, 60, 60 ..
                    var offset = gap * Math.ceil(index / 2);

                    // Now we need the vertices to be placed at points which are 'offset' pixels distant
                    // from the first link and forms a perpendicular angle to it. And as index goes up
                    // alternate left and right.
                    //
                    //  ^  odd indexes
                    //  |
                    //  |---->  index 0 line (straight line between a source center and a target center.
                    //  |
                    //  v  even indexes
                    var sign = index % 2 ? 1 : -1;
                    var angle = g.toRad(theta + sign * 90);

                    // We found the vertex.
                    var vertex = g.point.fromPolar(offset, angle, midPoint);

                    sibling.set('vertices', [{ x: vertex.x, y: vertex.y }]);
                });
        }
    };

    var myAdjustVertices = _.partial(adjustVertices, graph);

    // adjust vertices when a cell is removed or its source/target was changed
    graph.on('add remove change:source change:target', myAdjustVertices);

    // also when an user stops interacting with an element.
    paper.on('cell:pointerup', myAdjustVertices);


    paper.on('cell:pointerup', function(cellView, evt, x, y) {

        // Find the first element below that is not a link nor the dragged element itself.
        var elementBelow = graph.get('cells').find(function(cell) {
            if (cell instanceof joint.dia.Link) return false; // Not interested in links.
            if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
            if (cell.getBBox().containsPoint(g.point(x, y))) {
                return true;
            }
            return false;
        });

        // If the two elements are connected already, don't
        // connect them again (this is application specific though).
        //If a link is dragged onto an element, don't create another link
        if (elementBelow && !_.contains(graph.getNeighbors(elementBelow), cellView.model) && (cellView.model instanceof joint.dia.Link) === false) {

//      new link from drag-and-drop
            graph.addCell(new joint.dia.Link({
                source: {
                    id: cellView.model.id
                },
                target: {
                    id: elementBelow.id
                },
                attrs: {
                    '.marker-source': {
                        d: 'M 10 0 L 0 5 L 10 10 z'
                    },
                    
                    '.connection': { 'stroke-width': 3, stroke: '#000000' }
                },
                connector: { name: 'smooth' }
            }));
            // Move the element a bit to the side.
            cellView.model.translate(300, 0);
        }

    });



// write to JSON
//
//    var fs = require('fs');
//    graph.toJSON();
//    myJson = JSON.stringify(graph);

    // Cannot use "require('module_name');" on the client side


    var socket = io.connect('http://localhost:3000');
    var $box = $('#title');



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

    // response for a new message
    socket.on('new message', function (data) {
        console.log('Title set as: ' + data);
    });

    socket.on('successful_save', function(data) {
        console.log(data);
    });

    // sends message on click
    $('#save').click(function(event) {
        event.preventDefault();

        graph.toJSON();
        var graphTitle = String($box.val());
        socket.emit('setting title', graphTitle);

        console.log('button click, message sending... ');

        socket.emit('sendGraph', { mGraph: graph, title: graphTitle });

        var graphJson = JSON.stringify(graph);
        socket.emit('sendGraphJson', { mGraph: graphJson, title: graphTitle });

    });

    $('#load').click(function(event)    {
        event.preventDefault();

        socket.emit('Sending file name', String($box.val()));
        console.log('Sending file name to server');

    });

    socket.on('successful_load', function (data) {
        console.log("JSON file sending to client to re-render graph!");
        graph.clear();
        graph.fromJSON(JSON.parse(data));
        console.log("Sucessfully loaded graph!");
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