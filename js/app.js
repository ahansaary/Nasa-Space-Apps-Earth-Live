// historical data
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
        target: 'mapHistorical'
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

    var $eventsBtn = $('<button class="events button button-clear">Events</button>');
    $menu.append($eventsBtn);

    var $exportMap = $('<button class="export-map button button-clear" title="Export Map"><i class="fa fa-download"></i></button>');
    $menu.append($exportMap);

    $exportMap.click(function() {
        map.once('postcompose', function(event) {
            var canvas = event.context.canvas;
            downloadURI(canvas.toDataURL('image/png'), 'map.png');
        });
        map.renderSync();
    });

    var layersJson = [];
    $.getJSON('json/layers.json', function(data) {
        data.forEach(function(e) {
            layersJson.push(e);
        });
    });

    $addLayer.click(function() {
        if ($menu.find('.realTimeEvents').length && $menu.find('.realTimeEvents').css('display') == 'block') {
            $('.realTimeEvents').css('display', 'none');
        }
        if (!$menu.has('ul.historicalLayers').length) {
            // layers.json data file
            var $ul = $('<ul class="historicalLayers"></ul>');
            layersJson.forEach(function(e, i) {
                $ul.append('<li><label><input data-index="'+i+'" class="layerCheckBox" type="checkbox"> '+e.title+'</label></li>');
            });
            $menu.append($ul);
        } else {
            var $historicalLayers = $menu.find('ul.historicalLayers');
            if($historicalLayers.css('display') == 'block') {
                $historicalLayers.css('display', 'none');
            } else {
                $historicalLayers.css('display', 'block');
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

    // ----------------------------------------------------------------------------------
    // real time data
    var server = "http://eonet.sci.gsfc.nasa.gov/api/v2.1";

    $eventsBtn.click(function() {
        getEvents(server, $menu);
    });


    // newLayer = addNewWMSLayers(map, null, ['gpw-v3:gpw-v3-population-density_2000']);
});

// ------------ Historical Data ----------------- //

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

// ------------ Real Time Data ----------------- //

function getEvents(server, $menu) {
    $.getJSON( server + "/events", {
            status: "open",
            limit: 20
        })
    .done(function( data ) {
        if ($menu.find('.historicalLayers').length && $menu.find('.historicalLayers').css('display') == 'block') {
            $('.historicalLayers').css('display', 'none');
        }

        if (!$menu.has('ul.realTimeEvents').length) {
            var $ul = $('<ul class="realTimeEvents"></ul>');
            $.each( data.events, function( key, event ) {
                $ul.append('<li><label title="'+event.description+'"><input data-id="'+event.id+'" class="eventCheckBox" type="checkbox"> '+event.title+'</label></li>');
            });
            $menu.append($ul);
        } else {
            var $realTimeEvents = $menu.find('ul.realTimeEvents');
            if($realTimeEvents.css('display') == 'block') {
                $realTimeEvents.css('display', 'none');
            } else {
                $realTimeEvents.css('display', 'block');
            }
        }

        $menu.find('.eventCheckBox').on('change', function() {
            if (this.checked) {
                showLayers(server, $(this).data('id'));
            } else {
                if (!$menu.find('.eventCheckBox:checked').length) {
                    $('#mapRealTime').hide();
                    $('#mapHistorical').show();
                }
            }
        });
    });
}

function showLayers(server, eventId) {
    // fetch the single event feed
    $.getJSON( server + "/events/" + eventId )
        .done(function( event ) {
            // Get the date and first location of the event.
            // Events can have multiple locations but we are simplifying here.
            var location = event.geometries[0];

            var $subLayers = $('<div class="subLayers"></div>'),
                $ul = $('<ul></ul>');

            // Show list of categories and children layers
            $.each( event.categories, function( key, category ) {
                $ul.append('<li>'+category.title+'</li>');

                // Get the applicable layers for the specific event category.
                // Only include WMTS_1_0_0 layers for now, will add WMS example later.
                $.getJSON( server + "/layers/" + category.id )
                    .done(function( data ) {
                        var layers = data['categories'][0]['layers'];
                        $.each( layers, function( key, layer ) {
                            if (layer.serviceTypeId == "WMTS_1_0_0") {
                                $ul.append('<li><label><input data-layer="'+encodeURIComponent(JSON.stringify(layer))+'" data-location="'+encodeURIComponent(JSON.stringify(location))+'" class="subLayerCheckBox" type="checkbox"> '+layer.name+'</label></li>');
                            }
                        });
                        $subLayers.append($ul);
                        $(document.body).append($subLayers);
                    });
            });
            $subLayers.on('change', '.subLayerCheckBox', function() {
                var encodedLayer = $(this).data('layer');
                var encodedLocation = $(this).data('location');

                $('#mapHistorical').hide();
                $('#mapRealTime').show();

                showMap(encodedLayer, encodedLocation);
            });
        });
}

function showMap(encodedLayer, encodedLocation) {
    var layer = JSON.parse(decodeURIComponent(encodedLayer));
    var location = JSON.parse(decodeURIComponent(encodedLocation));

    var center = getCenter(location);

    // quick and dirty way to extract day string from full ISO datetime
    var mapTime = new Date(location.date).toJSON().substring(0,10);

    displayMap(layer.serviceUrl, layer.name,
        center, mapTime,
        layer.parameters[0].FORMAT, layer.parameters[0].TILEMATRIXSET);
}

function getCenter(geojson) {
    if (geojson.type == "Point") {
        return geojson.coordinates;
    } else if (geojson.type == "Polygon") {
        /*
         For this test we are going to compute the center point of the bounding box
         that encloses the geoJson Polygon.

         Since the Polygon specification consists of an outer ring and then inner holes,
         we will only compute the center of the first (outer) LinearRing in the Polygon.

         Convert these coordinates to 0-360 to make it easier
         */

        // use the first point of the first LinearRing as the default for calculations
        var ullat = geojson.coordinates[0][0][1] + 90;
        var ullon = geojson.coordinates[0][0][0] + 180;
        var lrlat = geojson.coordinates[0][0][1] + 90;
        var lrlon = geojson.coordinates[0][0][0] + 180;

        for (i = 0; i < geojson.coordinates[0].length; i++) {

            // longitudes
            if (geojson.coordinates[0][i][0] + 180 > ullon) {
                ullon = geojson.coordinates[0][i][0] + 180;
            }
            if (geojson.coordinates[0][i][0] + 180 < lrlon) {
                lrlon = geojson.coordinates[0][i][0] + 180;
            }

            // latitudes
            if (geojson.coordinates[0][i][1] + 90 > ullat) {
                ullat = geojson.coordinates[0][i][1] + 90;
            }
            if (geojson.coordinates[0][i][1] + 90 < lrlat) {
                lrlat = geojson.coordinates[0][i][1] + 90;
            }
        }

        centerX = (ullon + ((lrlon - ullon) / 2)) - 180;
        centerY = (lrlat + ((ullat - lrlat) / 2)) - 90;

        return [centerX, centerY];
    }
}

function displayMap(serviceUrl, layerName, center, dateStr, format, matrixSet) {
    // call empty() to make sure another map doesn't already exist there
    $( "#mapRealTime" ).empty();

    var map = new ol.Map({
        view: new ol.View({
            // maxResolution: 0.5625,
            projection: ol.proj.get("EPSG:4326"),
            extent: [-180, -90, 180, 90],
            center: center,
            zoom: 2,
            // maxZoom: 8
        }),
        target: "mapRealTime",
        renderer: ["canvas", "dom"]
    });

    /*
     This determination of resolutions is based solely on the capabilities
     of the NASA GIBS WMTS as it is currently the only WMTS server represented
     in EONET. More information about GIBS: http://go.nasa.gov/1GTDj3V
     */
    var source = new ol.source.WMTS({
        url: serviceUrl + "?time=" + dateStr,
        layer: layerName,
        format: format,
        matrixSet: matrixSet,
        tileGrid: new ol.tilegrid.WMTS({
            origin: [-180, 90],
            resolutions: [
                0.5625,
                0.28125,
                0.140625,
                0.0703125,
                0.03515625,
                0.017578125,
                0.0087890625,
                0.00439453125,
                0.002197265625
            ],
            matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            tileSize: 512
        })
    });

    var layer = new ol.layer.Tile({
        source: source
    });

    map.addLayer(layer);
}

function downloadURI(uri, name)
{
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    link.click();
}