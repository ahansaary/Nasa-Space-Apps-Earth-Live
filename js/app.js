$(document).ready(function () {
    // Create latitude and longitude and convert them to default projection
    var egypt = ol.proj.transform([29.8206, 23.8025], 'EPSG:4326', 'EPSG:3857');

    // Declare a Tile layer with an OSM source
    var osm = new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'osm'})
    });

    // Declare a Tile layer with an Satellite source
    var satallite = new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'sat'})
    });

    // Create a View, set it center and zoom level
    var view = new ol.View({
        center: egypt,
        zoom: 5
    });

    // Instantiate a Map, set the object target to the map DOM id
    var map = new ol.Map({
        target: 'map'
    });

    // Set the view for the map
    map.setView(view);

    // set OSM layer as default layer
    map.addLayer(osm);

    // menu button
    var $menuBtn = $('<div class="menuBtn"><i class="fa fa-bars"></i></div>');
    var $menu = $('<div class="menu"></div>');

    $menuBtn.click(function() {
        $('.menu').fadeIn(300);
    });

    $menu.append('<i class="fa fa-times"></i>');
    $menu.on('click', 'i.fa.fa-times', function() {
        $(this).parents('.menu').fadeOut(300);
    });

    // toggle base layer
    var $toggleBaseLayer = $('<button class="toggleBaseLayer">Satellite Map</button>');
    $menu.append($toggleBaseLayer);

    $toggleBaseLayer.click(function() {
        if ($(this).text() == "Satellite Map") {
            map.removeLayer(osm);
            map.addLayer(satallite);
            $(this).text("Open Street Map");
        } else {
            map.removeLayer(satallite);
            map.addLayer(osm);
            $(this).text("Satellite Map");
        }
    });

    var $addLayer = $('<button class="addLayer">Add Layer</button>');
    $menu.append($addLayer);

    var layersJson = [];
    $.getJSON('json/layers.json', function(data) {
        data.forEach(function(e) {
            layersJson.push(e);
        });
    });

    $addLayer.click(function() {
        if (!$menu.has('ul').length) {
            // layers.json data file
            var $ul = $('<ul></ul>');
            layersJson.forEach(function(e, i) {
                $ul.append('<li><label><input data-index="'+i+'" class="layerCheckBox" type="checkbox"> '+e.title+'</label></li>');
            });
            $menu.append($ul);
        } else {
            $ul = $menu.find('ul');
            if($ul.css('display') == 'block') {
                $ul.css('display', 'none');
            } else {
                $ul.css('display', 'block');
            }
        }
    });

    $menu.on('change', '.layerCheckBox', function() {
        if (this.checked){
            var layers = layersJson[$(this).data('index')].layers,
                $subLayers = $('<div class="subLayers"></div>'),
                $ul = $('<ul></ul>');
            for (var layer in layers) {
                if (layers.hasOwnProperty(layer)) {
                    $ul.append('<li><label><input data-layer="'+layers[layer]+'" class="subLayerCheckBox" type="checkbox"> '+layer+'</label></li>');
                    $subLayers.append($ul);
                }
            }
            $(document.body).append($subLayers);
        } else {
            //
        }
    });

    $(document.body).append($menuBtn);
    $(document.body).append($menu);

    // newLayer = addNewWMSLayers(map, null, ['gpw-v3:gpw-v3-population-density_2000']);
});

function addNewWMSLayers(map, url, layers) {
    if (url == null) {url = 'http://sedac.ciesin.columbia.edu/geoserver/wms'}
    var layerTile = new ol.layer.Tile({
        source: new ol.source.TileWMS({
            url: url,
            params: {
                LAYERS: layers
            }
        })
    });
    map.addLayer(layerTile);
    return layerTile;
}