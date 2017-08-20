var sleep = require('sleep');
var gpio = require('node-gpio');
var PWM = gpio.PWM;
var mqtt = require('mqtt')

var config = {
    'mqtt': {},
    'led': {}
}

config.mqtt.broker = process.env.MQTT_BROKER || 'mqtt://localhost:1883'
config.mqtt.prefix = process.env.MQTT_PREFIX || 'media'
config.mqtt.topic = process.env.MQTT_TOPIC || 'button'
config.mqtt.user = process.env.MQTT_USER
config.mqtt.password = process.env.MQTT_PASSWORD

config.led.channel = process.env.LED_CHANNEL || '18'
config.led.pwm_cycle = process.env.LED_PWM_CYCLE || '0.01'
config.led.num_flashes = process.env.LED_NUM_FLASHES || '3'

var options = {}
if(config.mqtt.user) options.username = config.mqtt.user
if(config.mqtt.password) options.password = config.mqtt.password

var client  = mqtt.connect(config.mqtt.broker, options)
client.on('connect', function () {
  console.log("MQTT Connected")
  console.log("subscribing to: " + config.mqtt.prefix + '/' + config.mqtt.topic)
  client.subscribe(config.mqtt.prefix + '/' + config.mqtt.topic)
});

var led = new PWM(config.led.channel);
led.open();
led.frequency = 50;
led.dutyCycle = 0;
led.start();

client.on('message', function (topic, message) {
  for (var flashes = 0; flashes < config.led.num_flashes; flashes++) {
    console.log("flashing")
    for (var i = 0; i < 101; i+=2) {
      led.dutyCycle = i;
      sleep.usleep(config.led.pwm_cycle * 1000000)
    }
    for (var i = 100; i > 0; i-=2) {
      led.dutyCycle = i;
      sleep.usleep(config.led.pwm_cycle * 1000000)
    }
  }
});

process.on('SIGINT', function () {
    led.stop();
    led.close();
    client.end()
    process.exit();
})
