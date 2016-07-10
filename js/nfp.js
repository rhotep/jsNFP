function nfp_cycle(startDate){
	this.startDate 	= startDate||new Date();
	this.days 		= [];

	this.default_day = {
		date: 			null,
		temperature: 	null,
		blood:			null,
		slime:			null,
		hidden:			false,
	}

	this.importMyNFP = function(url){
		var self = this;
		this.loading = true;
		$.ajax({
			"url":		url,
			"async": 	false,
			"dataType": "text",
		}).done(function(data){
			self.days = [];
			var lines = String(data).split("\n");
			
			for(var i=3; i < lines.length; i++){				
				var line = lines[i];
				while(line.match(/,,/)){
					line = line.replace(/,,/,',"",')
				}
				var entries = eval("["+line.replace(/,$/, ',""')+"]")
				if(entries[1] != ""){ // check if entry is broken
					var temperature		= Number(entries[3].replace(/,/,".")),	
						date 			= entries[1].split('.'),
						time 			= entries[2].split(':'), //not sure if mynfp actually uses colons for the time
						slime_levels	= {'t' : 0, 'o' : 1, 'f' : 2, 's' : 3, 'sp' : 4}
							
					var day = {
						'date': 		new Date(Number(date[2]), Number(date[1])-1, Number(date[0]), Number(time[0])||0, Number(time[1])||0, Number(time[2])||0),
						'time':			time.join(':'),
						'temperature':	(temperature == 0) ? null : temperature,
						'blood':		Number(entries[4])||null,
						'slime':		entries[5]!=''? slime_levels[entries[5]] : null,
						'hidden':		false	
					}
					self.addReading(day)								
				}
			}
		}).error(function(data){l(data)})

		return(this)
	}

	this.export = function(){
		return(this.days)
	}

	function smoothReading(day){
		for(property in this.default_day){
			day[property] = day[property] != undefined ? day[property] : this.default_day[property]
		}
		return(day)
	}

	this.getRoundedReadings = function(nonhidden){
		nonhidden == nonhidden != undefined ? nonhidden : false	//get hidden and nonhidden values by default
		var readings = []

		for(var i = 0; i<this.days.length; i++){
			if(this.days[i].temperature != null && !(nonhidden && this.days[i].hidden)){
				readings.push({value: Math.round(this.days[i].temperature*20)/20, index:i})
			}
		}
		return(readings)
	}

	this.setData = function(days){
		for(var i=0; i<days.length; i++){
			days[i] = smoothReading(days[i]);
		}
		this.days = days;
		this.startDate = days[0].date;		
	}


	this.addReading = function(n, data){	// add reading for the nth day (starting at day 0)
		if(n == undefined){			// if called without parameters add one default day at the end of the cycle
			data	= this.default_day
			n		= this.length()
		}else{
			if(data == undefined){	// if called with just one parameter	
				if(isNaN(n)){		// if no day is specified, add a new one at the end of the cycle
					data 	= n
					n 		= this.length()
				}else{				// if no data is specified, add a default day
					data 	= this.default_day
				}
			}
		}
		while(this.length()<n+1){
			this.days.push(this.default_day)
		}
		this.days[n] = smoothReading(data)
		this.startDate = this.days[0].date
		return(this)
	}

	this.length = function(){
		return(this.days.length)
	}

	this.getStartDate = function(){
		return(this.startDate||null)
	}

	this.getLastDate = function(){
		return(this.days[this.length()-1].date||null)
	}

	this.eval_thermal = function(){
		var readings = this.getRoundedReadings(true)
		for(var i=6; i<readings.length; i++){

			var result = {
				helper_line:		null, //highest of the 6 readings before higher_readings[0]
				higher_readings:  	null, //higher_readings[2] must be 2 °C higher than helper_line
			}

			var tries	= 0 //counts non-hidden and non-missing readings
			var hits 	= 0 //counts readings of lower temperature

			var to_check_against 	= readings[i].value
			var to_check 			= readings[i-tries].value
			var max						= 0
			
			while(					
					hits 		< 6		// not enough lower readings yet 
					&& tries	< i		// still some tries left
			)
			{
				tries++	
				to_check 		= readings[i-tries].value

				if(to_check < to_check_against){
					max = to_check > max ? to_check : max
					hits++
				}else{
					break
				}
			}
			
			result.last_higher_reading = null;

			if(hits>=6){							// found 6 lower readings!
				result.helper_line = max			// max is the highest of the lower readings

				if(	//basic rule
					   i+2< readings.length
					&& readings[i+1].value > max 
					&& readings[i+2].value >= max+0.2
				){
					result.higher_readings = [
						{
							x:	readings[i].index, 
							y:	readings[i].value
						},
						{
							x:	readings[i+1].index, 
							y:	readings[i+1].value
						},
						{
							x:	readings[i+2].index, 
							y:	readings[i+2].value
						},
					]
					result.last_higher_reading = readings[i+2].index
					return(result)
				}

				if(	//exception rule 1
					   i+3< readings.length
					&& readings[i+1].value > max 
					&& readings[i+2].value > max 
					&& readings[i+3].value > max
				){			
					result.higher_readings = [
						{
							x:	readings[i].index, 
							y:	readings[i].value
						},
						{
							x:	readings[i+1].index, 
							y:	readings[i+1].value
						},
						{
							x:	readings[i+2].index, 
							y:	readings[i+2].value
						},
						{
							x:	readings[i+3].index, 
							y:	readings[i+3].value
						},
					]
					result.last_higher_reading = readings[i+3].index
					return(result)
				}
				
					//exception rule 2
				result.higher_readings = [{
						x:	readings[i].index, 
						y:	readings[i].value
				}]

				for(var j=1; j<=3; j++){
					if(readings[i+j] && readings[i+j].value > max){
						result.higher_readings.push({
							x:	readings[i+j].index, 
							y:	readings[i+j].value					
						})
					}
					if(result.higher_readings.length==3){	// three higher readings found, one reading omitted
						result.last_higher_reading = readings[i+j].index
						return(result)
					}	
				}
				
			}
		}

		return(null)
	}

	this.symptothermal = function(){
		var result			= this.eval_thermal() || {},
			last 			= 0,
			run				= null
			result.slime	= {}
		
		if(!result) return(null)
		result.slime.runs	= []
	
		for(var i= 1; i<this.days.length; i++){	// start with the second day, the first one cannot		

			var dolh = result.higher_readings[result.higher_readings.length-1].x // day of last higher reading

			if(this.days[i].slime){				//days without slime value are ignored

				var value = {x: i, y: this.days[i].slime}

				if(	!run 												// There has been no local maximum before
					&& this.days[last].slime > this.days[i].slime		// Base rule local maximum
				){
					run = [{x: last, y: this.days[last].slime}]			// New run starting with local maximum
				}

																		// Exception rule 1:
 				if(	run 												// There has been a local maximum before
					&& run.length < 4									// run is not complete complete
					&& this.days[i].slime >= run[0].y	 				// but there is a new maximum				
				){
					result.slime.runs.push(run)								// Store old run
					run = []											// Start new run with new local maximum								
				}
				
																		// Exception rule 2:
				if(	run 												// There has been a local maximum before
					&& run.length == 4									// run is complete
					&& i < dolh											// temperature evaluation is complete
					&& this.days[i].slime >= run[0].y	 				// but there is a new maximum

				){
					result.slime.runs.push(run)								// Store old run
					run = []											// Start new run with new local maximum			
				}

				if(	run && 												// There has been a local maximum before
					run.length < 4										// Just looking for H, 1, 2, 3
				){ 
					run.push(value)										// Add another value to the run
				}
				last = i												
			}
		}		
		result.slime.runs.push(run)
		result.slime.complete == result.slime.runs[result.slime.runs.length-1].length == 4
		return(result)
	}

}

function nfp_calendar(){
	this.cycles = new Array();

	this.addCycle = function(cycle){
		this.cycles.push(cycle);
		this.sortByDate(1)
		return(this)
	}
	
	this.getCycle = function(x){
		return(this.cycles[x] || null)
	}

	this.sortByDate = function sortByDate(dir){ //dir == 1 stands for recent first
		dir = dir || 1
		function sort(a,b){
			var a_start = a.getStartDate() || new Date()
			var b_start	= b.getStartDate() || new Date()
			return(dir*(b_start.getTime()-a_start.getTime()))
		}
		this.cycles.sort(sort)
	}

	this.export	= function(){
		var data	= [],
			i		= this.cycle.length()
		while(i){
			i--
			data.push(this.cycles[i])
		}
		return(data)
	}
}

var nfp_test = new nfp_calendar();
nfp_test.addCycle(new nfp_cycle().importMyNFP("data/20120613_cycle209315.csv"));
nfp_test.addCycle(new nfp_cycle().importMyNFP("data/20120613_cycle215229.csv"));
nfp_test.addCycle(new nfp_cycle().importMyNFP("data/20120613_cycle219652.csv"));
nfp_test.addCycle(new nfp_cycle().importMyNFP("data/20120613_cycle223836.csv"));




