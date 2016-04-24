var selectedLayers = {};
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
    var $toggleBaseLayer = $('<button class="toggleBaseLayer button button-clear">Satellite Map</button>');
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
        $('.menu').fadeOut(300);
    });

    var $addLayer = $('<button class="addLayer button button-clear">Add Layer</button>');
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
        var layers = layersJson[$(this).data('index')].layers;
        if (this.checked){
            var $subLayers = $('<div class="subLayers"></div>'),
                $ul = $('<ul></ul>');
            for (var layer in layers) {
                if (layers.hasOwnProperty(layer)) {
                    $ul.append('<li><label><input data-layer="'+layers[layer]+'" class="subLayerCheckBox" type="checkbox"> '+layer+'</label></li>');
                    $subLayers.append($ul);
                }
            }
            $(document.body).append($subLayers);
        } else {
            for (var layer in layers) {
                if (layers.hasOwnProperty(layer)) {
                    var layersArray = layers[layer].toString().split(',');
                    if(layersArray.length > 1) {
                        layersArray.forEach(function(e) {
                            map.removeLayer(selectedLayers[e]);
                            $('.legend[data-layer="'+e+'"]').remove();
                        });
                    } else {
                        map.removeLayer(selectedLayers[layers[layer]]);
                        $('.legend[data-layer="'+layers[layer]+'"]').remove();
                    }
                    $('.menu').fadeOut(300);
                }
            }

        }
    });

    $(document.body).on('change', '.subLayerCheckBox', function() {
        if (this.checked) {
            var layer = $(this).data('layer');
            var layersArray = layer.split(',');
            if(layersArray.length > 1) {
                var $subLayers = $('<div class="subLayers"></div>'),
                    $ul = $('<ul></ul>');
                layersArray.forEach(function(e) {
                    $ul.append('<li><label><input data-layer="'+e+'" class="subLayerCheckBox" type="checkbox"> '+e+'</label></li>');
                    $subLayers.append($ul);
                });
                $(document.body).append($subLayers);

            } else {
                addNewWMSLayers(map, null, layer);
                getLayerLegend(layer);
                $('.subLayers').remove();
                $('.menu').fadeOut(300);
            }
        }
    });

    $(document.body).append($menuBtn);
    $(document.body).append($menu);

    // newLayer = addNewWMSLayers(map, null, ['gpw-v3:gpw-v3-population-density_2000']);
});

function addNewWMSLayers(map, url, layer) {
    if (url == null) {url = 'http://sedac.ciesin.columbia.edu/geoserver/wms'}
    var layerTile = new ol.layer.Tile({
        source: new ol.source.TileWMS({
            url: url,
            params: {
                LAYERS: layer
            }
        })
    });
    map.addLayer(layerTile);
    selectedLayers[layer] = layerTile;
    return layerTile;
}

function getLayerLegend(layer) {
    var legendUrl = "http://sedac.ciesin.columbia.edu/geoserver/wms?request=GetLegendGraphic&format=image%2Fpng&layer="+layer+"&width=15&height=15&legend_options=border:false;mx:0.05;my:0.02;dx:0.2;dy:0.07;fontSize:11;bandInfo:false;";
    // $('.legend').remove();
    $(document.body).append('<img data-layer="'+layer+'" class="legend" src="'+legendUrl+'">');
}