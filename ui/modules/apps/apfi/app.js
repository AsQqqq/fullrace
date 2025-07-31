angular.module("beamng.apps").directive("apfi", [function () {
  return {
  templateUrl: '/ui/modules/apps/apfi/app.html',
  replace: true,
  link: function (scope, element, attrs) {
	element.css({transition:'opacity 0.3s ease'})
/* Power */
	scope.powerHP = 0;
	scope.powerHP2 = 0;
	scope.powerHPLabel = 0;
	scope.powerHPRound = 0;
	scope.powerHPLabel2 = 0;
	scope.powerHPRound2 = 0;
	let powerNew = 0;
	let powerOld = 0;
	let powerRound = 0;
	let powerNew2 = 0;
	let powerOld2 = 0;
	let powerRound2 = 0;

/* Torque */
	scope.powerTQ = 0;
	let powerTQNew = 0;
	let powerTQOld = 0;

/* Weight */
	scope.weight = 0;
	scope.weightlbs = 0;
	scope.ratio = 0;
	let weightOld = 0;
	let weightNew = 0;

/* Speed */
	scope.firstspeed = 0;
	scope.calcspeed = 0;
	scope.finalspeedRound = 0;
	let speedNew = 0;
	let speedOld = 0;

/* Acceleration */
	scope.firstaccel = 0;
	scope.accelRound = 0;
	scope.finalaccel = 0;
	let accelNew = 0;
	let accelOld = 0;

/* Displays */
	scope.rating = 0;
	scope.roundrating = 0;
	scope.displayrating = 0;
	scope.displayclass = "";
	scope.displayspeed = 0;
	scope.displaypower = 0;
	scope.displaypower2 = 0;
	scope.displayaccel = 0;
	scope.displayhandling = 0;
	scope.displayfinalpower = 0;

/* Constants */
	const LuaFinal = `(function()return powertrain.getDevicesByCategory("engine")[1].maxPower end)()`;
	const LuaPower1 = `(function()return powertrain.getDevicesByCategory("engine")[1].maxPower end)()`;
	const LuaTorque = `(function()return powertrain.getDevicesByCategory("engine")[1].maxTorque end)()`;
	const LuaPower2 = `(function()return powertrain.getDevicesByCategory("engine")[2].maxPower end)()`;
	const LuaWeight = `(function()return obj:calcBeamStats().total_weight end)()`;

/* THE CODE */
	setTimeout(()=>bngApi.activeObjectLua(LuaPower1, function(power){ 
	scope.powerHP = Math.ceil(power * 0.986); /* metric to imperial horsepower */
	powerNew = scope.powerHP;
	scope.powerHPRound = powerNew / 80; /* horsepower to stat/progress bar conversion */
	powerRound = scope.powerHPRound;
	scope.powerHPLabel = Math.ceil(powerRound*10)/10; /* Round to nearest decimal */
	scope.displaypower = scope.powerHPLabel.toFixed(1);
	scope.powerDif = (powerOld - powerNew) * (-1);
	}), 50) /* Engine #1 */
	
	setTimeout(()=>bngApi.activeObjectLua(LuaPower2, function(power2){
	scope.powerHP2 = Math.ceil(power2 * 0.986); /* metric to imperial horsepower */
	powerNew2 = scope.powerHP2;
	scope.powerHPRound2 = powerNew2 / 80; /* horsepower to stat/progress bar conversion */
	powerRound2 = scope.powerHPRound2;
	scope.powerHPLabel2 = Math.ceil(powerRound2*10)/10; /* Round to nearest decimal */
	scope.displaypower2 = scope.powerHPLabel2.toFixed(1);
	scope.powerDif2 = (powerOld2 - powerNew2) * (-1);
	}), 50) /* Engine #2 */
	
	setTimeout(()=>bngApi.activeObjectLua(LuaTorque, function(torque){
	scope.powerTQ = Math.ceil(torque)*0.737; /* Convert N-M to LB-FT */
	powerTQNew = scope.powerTQ;
	scope.powerDif = (powerTQOld - powerTQNew) * (-1);
	}), 50)
	
	setTimeout(()=>	bngApi.activeObjectLua(LuaWeight, function(weight){
	scope.weight = Math.ceil(weight); /* weight is in KG */
	scope.weightlbs = (scope.weight * 2.204623); /* converting KG to LBS */
	weightNew = scope.weight;
	scope.weightDif = weightNew - weightOld;
	scope.ratio = powerNew / weightNew;
	scope.ratio = scope.ratio.toFixed(3);
	}), 50)
	
	setTimeout(()=>bngApi.activeObjectLua(LuaFinal, function(engineif){
	scope.displayfinalpower = (scope.powerHP + scope.powerHP2);
	
	scope.firstaccel = (5.1 * (scope.weightlbs / scope.displayfinalpower) ** 0.37); /* Get 1/4 mile time for acceleration*/
	scope.accelRound = scope.firstaccel.toFixed(1); /* Round time to 1 decimal place*/
	scope.displayaccel = (6 / scope.accelRound); /* Progress bar display*/
	
	scope.firstspeed = Math.log10(scope.displayfinalpower); /* Get log of horsepower*/
	scope.calcspeed = ((15 * scope.firstspeed) + 350 * (scope.displayfinalpower / scope.weightlbs)**0.5); /* Rough Top Speed Estimation*/
	scope.finalspeedRound = (scope.calcspeed*10)/10; /* Round to decimal place */
	scope.displayspeed = scope.finalspeedRound.toFixed(1); /* Final Display Speed with 1 decimal point*/
	
	scope.rating = ((scope.displayaccel*1.8) * (scope.displayspeed*2.2)); /* Performance Number Scaling */
	scope.roundrating = Math.floor(scope.rating / 5) * 5; /* Round Performance Number to nearest 5 value (35, 40, 45, etc) */
	scope.displayrating = scope.roundrating.toFixed(0); /* Display only whole number */
	}), 100)

	setTimeout(()=>bngApi.activeObjectLua(LuaTorque, function(torque){
	if (scope.displayrating <= 149) { 											/* E - 0-149 */
		scope.displayclass = "E";
		document.getElementById('ratingdisplay1_1').className = 'ratingE';
	}
	if (scope.displayrating > 149 && scope.displayrating <= 224) {				/* D - 150 */
		scope.displayclass = "D";
		document.getElementById('ratingdisplay1_1').className = 'ratingD';
	}
	if (scope.displayrating > 224 && scope.displayrating <= 299) {				/* C - 225 */
		scope.displayclass = "C";
		document.getElementById('ratingdisplay1_1').className = 'ratingC';
	}
	if (scope.displayrating > 299 && scope.displayrating <= 399) {				/* B - 300 */
		scope.displayclass = "B";
		document.getElementById('ratingdisplay1_1').className = 'ratingB';
	}
	if (scope.displayrating > 399 && scope.displayrating <= 499) {				/* A - 400 */
		scope.displayclass = "A";
		document.getElementById('ratingdisplay1_1').className = 'ratingA';
	}
	if (scope.displayrating > 499 && scope.displayrating <= 599) {				/* A+ - 500 */
		scope.displayclass = "A+";
		document.getElementById('ratingdisplay1_1').className = 'ratingA2';
	}
	if (scope.displayrating > 599 && scope.displayrating <= 699) {				/* S - 600 */
		scope.displayclass = "S";
		document.getElementById('ratingdisplay1_1').className = 'ratingS';
	}
	if (scope.displayrating > 699 && scope.displayrating <= 899) {				/* S+ - 700 */
		scope.displayclass = "S+";
		document.getElementById('ratingdisplay1_1').className = 'ratingS2';
	}
	if (scope.displayrating > 899) {											/* X - 900 */
		scope.displayclass = "X";
		document.getElementById('ratingdisplay1_1').className = 'ratingX';
	}
	}), 1000)

scope.$on('VehicleFocusChanged', function(){

	setTimeout(()=>bngApi.activeObjectLua(LuaPower1, function(power){ 
	scope.powerHP = Math.ceil(power * 0.986); /* metric to imperial horsepower */
	powerNew = scope.powerHP;
	scope.powerHPRound = powerNew / 80; /* horsepower to stat/progress bar conversion */
	powerRound = scope.powerHPRound;
	scope.powerHPLabel = Math.ceil(powerRound*10)/10; /* Round to nearest decimal */
	scope.displaypower = scope.powerHPLabel.toFixed(1);
	scope.powerDif = (powerOld - powerNew) * (-1);
	}), 50) /* Engine #1 */
	
	setTimeout(()=>bngApi.activeObjectLua(LuaPower2, function(power2){
	scope.powerHP2 = Math.ceil(power2 * 0.986); /* metric to imperial horsepower */
	powerNew2 = scope.powerHP2;
	scope.powerHPRound2 = powerNew2 / 80; /* horsepower to stat/progress bar conversion */
	powerRound2 = scope.powerHPRound2;
	scope.powerHPLabel2 = Math.ceil(powerRound2*10)/10; /* Round to nearest decimal */
	scope.displaypower2 = scope.powerHPLabel2.toFixed(1);
	scope.powerDif2 = (powerOld2 - powerNew2) * (-1);
	}), 50) /* Engine #2 */
	
	setTimeout(()=>bngApi.activeObjectLua(LuaTorque, function(torque){
	scope.powerTQ = Math.ceil(torque)*0.737; /* Convert N-M to LB-FT */
	powerTQNew = scope.powerTQ;
	scope.powerDif = (powerTQOld - powerTQNew) * (-1);
	}), 50)
	
	setTimeout(()=>	bngApi.activeObjectLua(LuaWeight, function(weight){
	scope.weight = Math.ceil(weight); /* weight is in KG */
	scope.weightlbs = (scope.weight * 2.204623); /* converting KG to LBS */
	weightNew = scope.weight;
	scope.weightDif = weightNew - weightOld;
	scope.ratio = powerNew / weightNew;
	scope.ratio = scope.ratio.toFixed(3);
	}), 50)
	
	setTimeout(()=>bngApi.activeObjectLua(LuaFinal, function(engineif){
	scope.displayfinalpower = (scope.powerHP + scope.powerHP2);
	
	scope.firstaccel = (5.1 * (scope.weightlbs / scope.displayfinalpower) ** 0.37); /* Get 1/4 mile time for acceleration*/
	scope.accelRound = scope.firstaccel.toFixed(1); /* Round time to 1 decimal place*/
	scope.displayaccel = (6 / scope.accelRound); /* Progress bar display*/
	
	scope.firstspeed = Math.log10(scope.displayfinalpower); /* Get log of horsepower*/
	scope.calcspeed = ((15 * scope.firstspeed) + 350 * (scope.displayfinalpower / scope.weightlbs)**0.5); /* Rough Top Speed Estimation*/
	scope.finalspeedRound = (scope.calcspeed*10)/10; /* Round to decimal place */
	scope.displayspeed = scope.finalspeedRound.toFixed(1); /* Final Display Speed with 1 decimal point*/
	
	scope.rating = ((scope.displayaccel*1.8) * (scope.displayspeed*2.2)); /* Performance Number Scaling */
	scope.roundrating = Math.floor(scope.rating / 5) * 5; /* Round Performance Number to nearest 5 value (35, 40, 45, etc) */
	scope.displayrating = scope.roundrating.toFixed(0); /* Display only whole number */
	}), 100)

	setTimeout(()=>bngApi.activeObjectLua(LuaTorque, function(torque){
	if (scope.displayrating <= 149) { 											/* E - 0-149 */
		scope.displayclass = "E";
		document.getElementById('ratingdisplay1_1').className = 'ratingE';
	}
	if (scope.displayrating > 149 && scope.displayrating <= 224) {				/* D - 150 */
		scope.displayclass = "D";
		document.getElementById('ratingdisplay1_1').className = 'ratingD';
	}
	if (scope.displayrating > 224 && scope.displayrating <= 299) {				/* C - 225 */
		scope.displayclass = "C";
		document.getElementById('ratingdisplay1_1').className = 'ratingC';
	}
	if (scope.displayrating > 299 && scope.displayrating <= 399) {				/* B - 300 */
		scope.displayclass = "B";
		document.getElementById('ratingdisplay1_1').className = 'ratingB';
	}
	if (scope.displayrating > 399 && scope.displayrating <= 499) {				/* A - 400 */
		scope.displayclass = "A";
		document.getElementById('ratingdisplay1_1').className = 'ratingA';
	}
	if (scope.displayrating > 499 && scope.displayrating <= 599) {				/* A+ - 500 */
		scope.displayclass = "A+";
		document.getElementById('ratingdisplay1_1').className = 'ratingA2';
	}
	if (scope.displayrating > 599 && scope.displayrating <= 699) {				/* S - 600 */
		scope.displayclass = "S";
		document.getElementById('ratingdisplay1_1').className = 'ratingS';
	}
	if (scope.displayrating > 699 && scope.displayrating <= 899) {				/* S+ - 700 */
		scope.displayclass = "S+";
		document.getElementById('ratingdisplay1_1').className = 'ratingS2';
	}
	if (scope.displayrating > 899) {											/* X - 900 */
		scope.displayclass = "X";
		document.getElementById('ratingdisplay1_1').className = 'ratingX';
	}
	}), 1000)

});

}}}]);

