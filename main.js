(function () {
  "use strict";
  
  var radioState = "disconnected";
  var usedGamepad;
  
  window.onload = function() {
    document.querySelector('#connectButton').onclick = function() {
      
      if (radioState === "disconnected") {
        Crazyradio.open(function(state) {
          console.log("Crazyradio opened: " + state);
          if (state === true) {
            Crazyradio.setChannel($("#channel").val(), function(state) {
              Crazyradio.setDatarate($("#datarate").val(), function(state) {
                if (state) {
                  $("#connectButton").text("Disconnect");
                  $("#packetLed").addClass("connected");
                  
                  radioState = "connected";
                  $('#channel').prop('disabled', true);
                  $('#datarate').prop('disabled', true);
                }
              });
            });
          }
        });
      } else if (radioState === "connected") {
        radioState = "disconnected";
        Crazyradio.close();
        
        $("#connectButton").text("Connect Crazyflie");
        $("#packetLed").removeClass("connected");
        
        $('#channel').prop('disabled', false);
        $('#datarate').prop('disabled', false);
      }
    };
    
    window.setInterval(sendSetpoint, 30);
  };
  
  function sendSetpoint() {
    
    var gamepads = navigator.getGamepads();
    
    // Selecting gamepad
    if (usedGamepad === undefined) {
      _(gamepads).each(function (g) {
        if (g) {
          if (g.buttons[0].pressed) {
            usedGamepad = g.index;
            
            $("#gamepadText").text("Using: " + g.id);
          }
        }
      });
    }
    
    if (radioState !== "connected") return;
    
    var pitch = 0,
        roll  = 0,
        yaw   = 0,
        thrust = 0;
    
    // Getting values from gamepad
    if (usedGamepad !== undefined) {
      roll = gamepads[usedGamepad].axes[0] * 30;
      pitch = gamepads[usedGamepad].axes[1] * 30;
      yaw = gamepads[usedGamepad].axes[2] * 200;
      thrust = gamepads[usedGamepad].axes[3] * -55000;
    }
    
    if (thrust < 500) thrust = 0;
    
    //Preparing commander packet
    var packet = new ArrayBuffer(15);
    var dv = new DataView(packet);
    
    dv.setUint8(0, 0x30, true);      // CRTP header
    dv.setFloat32(1, roll, true);    // Roll
    dv.setFloat32(5, pitch, true);   // Pitch
    dv.setFloat32(9, yaw, true);     // Yaw
    dv.setUint16(13, thrust, true);  // Thrust
    
    Crazyradio.sendPacket(packet, function(state, data) {
      if (state === true) {
        $("#packetLed").addClass("good");
      } else {
        $("#packetLed").removeClass("good");
      }
    });
  }
  
}());