$(function() {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: $('#myholder'),
        width: $(window).width(),
        height: $(window).height(),
        model: graph
    });

    //Creates rectangle shape
    var rect = new joint.shapes.basic.Rect({
        position: { x: 100, y: 100 },
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'blue' }, text: { text: 'Idea 1', fill: 'white' } }
    });
    //Clones rectangle shape, change attributes
    var rect2 = rect.clone();
    rect2.translate(300);
    rect2.attr({
        rect: { fill: '#2C3E50', rx: 5, ry: 5, 'stroke-width': 2, stroke: 'black' },
        text: {
            text: 'Idea 2', fill: '#3498DB',
            'font-size': 18, 'font-weight': 'bold', 'font-variant': 'small-caps', 'text-transform': 'capitalize'
        }
    });

    var rect3 = rect2.clone().translate(200, 50).attr('text/text', '3')

    var link1 = new joint.dia.Link({
        source: { id: rect.id },
        target: { id: rect2.id },

    });
    link1.set('smooth', true);

    var link2 = link1.clone();
    var l2 = link1.clone();
    var l3 = link1.clone();
    var l4 = link1.clone();
    var l5 = link1.clone();

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

    graph.addCells([rect, rect2, rect3, link1, link2, l2, l3, l4, l5]);

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
                    'smooth': true
                }
            }));
            // Move the element a bit to the side.
            cellView.model.translate(300, 0);
        }

    });

    document.getElementById("newRectangle").addEventListener("click", newRect(graph));

    function newRect(graph) {
        var newRect = new joint.shapes.basic.Rect({
            position: { x: 0, y: 0 },
            size: { width: 100, height: 30 },
            attrs: { rect: { fill: 'blue' }, text: { text: 'New Idea', fill: 'white' } }
        });
        graph.addCell(newRect);
    };

});


