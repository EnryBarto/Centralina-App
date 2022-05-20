var debug = false;

var app = {
    macAddress: "",  // get your mac address from bluetoothSerial.list

/*
    Application constructor
 */
    initialize: function() {
        $("#dati").hide();
        $("#pulsante_connetti").click(app.manageConnection);
        $("#pulsante_disconnetti").click(app.manageConnection);
        $("#invia").click(app.invia);
        $("#carica").click(app.richiediTempi);
        this.bindEvents();
    },
/*
    bind any events that are required on startup to listeners:
*/
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

/*
    this runs when the device is ready for user interaction:
*/
    onDeviceReady: function() {
        // check to see if Bluetooth is turned on.
        // this function is called only
        //if isEnabled(), below, returns success:
        var listPorts = function() {
            $("#scelta_dispositivo").show();
            $("#bt_non_attivo").hide();

            bluetoothSerial.list(
                function(dispositivi) {
                    dispositivi.forEach(function(device) {
                        $("#dispositivi_associati").append($("<option/>", {
                            value: device.address,
                            label: device.name
                            //label: (device.name + " " + device.address)
                        }));
                    })
                },
                function(error) {
                    $("#scelta_dispositivo").text(JSON.stringify(error));
                }
            );
        }

        // if isEnabled returns failure, this function is called:
        var notEnabled = function() {
            if (debug) app.display("Bluetooth is not enabled.");
            
            if(confirm("Il Bluetooth è disattivato. Apro le impostazioni di sistema?")) {
                bluetoothSerial.showBluetoothSettings();
            }

            $("#scelta_dispositivo").hide();
            $("#bt_non_attivo").show();
        }

         // check if Bluetooth is on:
        bluetoothSerial.isEnabled(
            listPorts,
            notEnabled
        );
    },
/*
    Connects if not connected, and disconnects if connected:
*/
    manageConnection: function() {

        // connect() will get called only if isConnected() (below)
        // returns failure. In other words, if not connected, then connect:
        var connect = function () {
            app.macAddress = $("#dispositivi_associati").val();
            // if not connected, do this:
            // clear the screen and display an attempt to connect

            if (debug) {
                app.clear();
                app.display("Attempting to connect to " + app.macAddress + ". Make sure the serial port is open on the target device.");
            }
            // attempt to connect:
            bluetoothSerial.connect(
                app.macAddress,  // device to connect to
                app.openPort,    // start listening if you succeed
                app.showError
            );
        };

        // disconnect() will get called only if isConnected() (below)
        // returns success  In other words, if  connected, then disconnect:
        var disconnect = function () {
            if (debug) app.display("attempting to disconnect");
            // if connected, do this:
            bluetoothSerial.disconnect(
                app.closePort,     // stop listening to the port
                app.showError      // show the error if you fail
            );
        };

        // here's the real action of the manageConnection function:
        bluetoothSerial.isConnected(disconnect, connect);
    },
/*
    subscribes to a Bluetooth serial listener for newline
    and changes the button:
*/
    openPort: function() {
        $("#home").hide();
        $("#dati").show();

        if (debug) app.display("Connected to: " + app.macAddress);

        // set up a listener to listen for newlines
        // and display any new data that's come in since
        // the last newline:
        bluetoothSerial.subscribe('\n', app.deserializza);

        bluetoothSerial.write("tempi");
    },

/*
    unsubscribes from any Bluetooth serial listener and changes the button:
*/
    closePort: function() {
        $("#home").show();
        $("#dati").hide();

        if (debug) app.display("Disconnected from: " + app.macAddress);

        // unsubscribe from listening:
        bluetoothSerial.unsubscribe(
                function () {
                    alert("Disconnessione effettuata");
                },
                app.showError
        );
    },
/*
    appends @error to the message div:
*/
    showError: function(error) {
        alert(error);

        bluetoothSerial.isConnected(
            function() {
                $("#home").hide();
                $("#dati").show();
            },
            function() {
                $("#home").show();
                $("#dati").hide();
            }
        );

    },

/*
    appends @message to the message div:
*/
    display: function(message) {
        var display = document.getElementById("message"), // the message div
            lineBreak = document.createElement("br"),     // a line break
            label = document.createTextNode(message);     // create the label

        display.appendChild(lineBreak);          // add a line break
        display.appendChild(label);              // add the message node
    },
/*
    clears the message div:
*/
    clear: function() {
        var display = document.getElementById("message");
        display.innerHTML = "";
    },

    invia: function () {
        if (debug) app.display("Invio i tempi");
        const obj = {
                    "t0": [parseInt(document.getElementById("t0off").value), parseInt(document.getElementById("t0on").value)],
                    "t1": [parseInt(document.getElementById("t1off").value), parseInt(document.getElementById("t1on").value)],
                    "t2": [parseInt(document.getElementById("t2off").value), parseInt(document.getElementById("t2on").value)],
                    "t3": [parseInt(document.getElementById("t3off").value), parseInt(document.getElementById("t3on").value)]
                }
        const myJSON = JSON.stringify(obj);

        bluetoothSerial.write(myJSON);
        app.richiediTempi();
    }, 

    richiediTempi: function () {
        if (debug) app.display("Richiedo i tempi");
        bluetoothSerial.write("tempi");
    },

    deserializza: function (data) {
        if (debug) {
            app.clear();
            app.display(data);
        }

        var obj = JSON.parse(data);

        for (var i = 0; i < 4; i++) {
            $("#t"+i+"off").val(obj["t"+i][0]);
        }

        for (var i = 0; i < 4; i++) {
            $("#t"+i+"on").val(obj["t"+i][1]);
        }

    }

};