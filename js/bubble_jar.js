function button(){
	var self = bubble()
	self.class_name = 'button'
	self.data = '';
	
	self.addView('plain',{
		render : function(){
			if(!self.data.appendTo){
				$('<div></div>').append(self.data).addClass('label').appendTo(self)
			}else{
				self.data.appendTo(self)
			}
		}
	})
	return(self)
}

function content(id){
	var self = bubble()
	self.class_name = 'content'
	
	self.addView('plain',{
		render : function(){
			$('<div></div>').append(self.data).appendTo(self)
		}
	})
	return(self);
}

function tile(){		//part of a ledge, see below
	/*******************
	/* params: configuration object; {obj:... , weight:..., maxto:..., pos:...}
	 */

	var self = bubble()

	self.class_name = 'tile'
	self.config		= {
		percentage: 100,
		pos:		0,
		obj:		$('<div></div>')
	}
	
	self.addView('horizontal',{
		render: function(){
			var total_weight 	= 1

			if(self.parent != null){
				total_weight = self.parent_bubble.total_weight || 1
			}
			self
			.css({'width':(100*self.config.weight/total_weight)+'%', 'margin-left':(100*self.config.pos/total_weight)+'%'})
			.addClass(tile.maxto ? 'maxto' : 'stretch')
			.append(self.config.obj)		
		}
	})	
	return(self)
}

function ledge(){		// bar with possibly multiple buttons or boxes

	/******
	/* @data = [{label1: string, callback1: function, weight: integer}, ...} 
	 */

	var self 	= bubble()
	
	self.class_name = 'ledge'
		
	self.addView('plain',{
		render : function(){
			var	maxed	= false,
				element = {}
			
			for(var index in self.bubbles){
				element = self.bubbles[index]
				element.renderView('horizontal').appendTo(self)
				if(element.maxto) maxed = true
			}
			if(!maxed){
				element.removeClass('stretch')
				element.addClass('maxto')
			}
		},
	})
	
	self.addTile = function(obj, weight, maxto){			
			var index = self.total_weight = self.total_weight || 0
			weight	= weight || 1
			maxto	= maxto == undefined ? null : maxto

			tile()
			.addTo(self, index)
			.setup({'obj': obj, 'weight':weight, 'pos': index, 'maxto' : maxto})

			self.total_weight += weight

			return(self)
	}
	/*
	self.maxto = function(){
		function max(){		
			var tiles 		= self.tiles,
				i			= tiles.length,
				max_height 	= tiles[0].obj.height(),
				adjust	= false
			
			while(i){ l(max_height)
				i--
				obj = tiles[i].obj
				if(obj.height() > max_height){
					max_height 	= obj.outerHeight(true)
					adjust	= true
				}
			}	
						
			if(adjust){
				$(tiles).each(function(index, element){
					with(element.obj){
						var diff = outerHeight(true)-height()
						height(max_height-diff)
					}
				})
			}
		}
		max()
		//window.setInterval(max, 500)
		return(self)
	}
	*/
	return(self)
}


function calendar_bubble(id){
	var self = bubble(id)
	self.class_name = 'calendar'

	self.addView('compact',{
		render : function(){
			button().setData('click me').renderView('plain').appendTo(self).click(
				function(){
					self.slideViewInto('full')
				}
			)
		}
	})

	self.addView('full',{
		render : function(){
			button()
			.setData('Neuer Zyklus')
			.renderView('plain')
			.appendTo(self)
			.click(
				function(){
					self.data.addCycle(new nfp_cycle().addReading())
					self.renderView('full')
				}
			)
			
			for(var i = 0; i<self.data.cycles.length; i++){
				ledge()
				.addTile(
					cycle_bubble()
					.addTo(self, i)	
					.setData(self.data.getCycle(i))
					.renderView('compact')

				)
				.renderView('plain')
				.appendTo(self)
			}
		}
	})
	
	return(self)
}


function cycle_bubble(){ //expects nfp_cyle() as data
	var self = bubble();

	self.class_name = 'cycle'	
	
	self.onupdate = function(){
//		if(self.chart != undefined){
//			self.chart.redraw()
//chart		}
	}
	
	self.addView('compact',{
		render : function(){
			var	cycle		= self.data,
				days 		= cycle.days
			
			
			var div = button()
			.renderView('plain')	
			.click(
				function(){
					self				
					.slideViewInto('full')
				}
			)		
				
			if(days.length>0){				
				$('<div></div>').addClass('date')
				.append($('<div>'+date(cycle.getStartDate())+'</div>').addClass('start'))
				.append($('<div>'+date(cycle.getLastDate())+'</div>').addClass('last'))
				.appendTo(div)

				var days_div = $('<div></div>').addClass('days')
				
				for(var i=0; i<days.length; i++){
					var temp_pct = Math.round(((days[i].temperature-35)/(37.4-35))*100);
					temp_pct = temp_pct < 0 ? 0 : temp_pct			//crop at 0%
					temp_pct = temp_pct > 100 ? 100 : temp_pct		//crop at 100%

					var blood_pct = days[i].blood*12
					
					$('<div></div>').addClass('day')
					.append($('<div></div>').addClass('temperature').css('height', temp_pct+'%'))
					.append($('<div></div>').addClass('blood').css('height', blood_pct+'%'))
					.appendTo(days_div)					
				}

				days_div.appendTo(div)
			}
			div.appendTo(self)
		},
	})

	self.getForm4Day = function(day){
		return(
			cycle_form_bubble()
			.addTo(self, day)
			.setData($.extend(self.data.days[day],{day:day}))

		)
	}

	self.selection_callback = function(day){
		var	cycle		= self.data,
			recent_day	= self.recent_day

		if(recent_day == day) return(false)
			
		self.getForm4Day(day)
		.slideViewInto('full', {
			container: self.side,
			dir: day > recent_day  ? 'left' : 'right',
			distance: 50,
			easing: 'swing',
		})
		self.recent_day 	= day
	}
	
	self.selectDay = function(day){
		var	cycle		= self.data
			
		day = (day + cycle.length()) % cycle.length()
		
		if(self.chart != undefined){
			self.chart.edit_callback = self.selection_callback
			self.chart.selectDataSet(day)	
		}else{
			self.selection_callback(0)
		}
	}

	self.updateDay = function(day, redraw){
		redraw = redraw == undefined ? true : redraw
		self.data.days[day] = self.getBubble(day).getValue()
		self.getForm4Day(day)
		self.chart.update(self.data, redraw)
	}

	self.updateAll = function(){
		for(day in self.bubbles){
			self.updateDay(day, false)
		}
		self.chart.redraw()
	}

	self.addView('full',{
		render : function(){	
			var	cycle		= self.data,
				days 		= cycle.days
				
			ledge()
			.addTile(
				button()
				.setData('Übersicht')
				.renderView('plain')
				.click(function(){
					self
					.parent_bubble
					.slideViewInto('full',$("body"),'right')
				})
				,2
			)
			.addTile(
				content()
				.setData('Zyklus: '+date(cycle.getStartDate())+' &ndash; '+date(cycle.getLastDate()))
				.renderView('plain')
				,9				
			)
			.addTile(
				button()
				.setData('Alle übernehmen')
				.renderView('plain')
				.click(self.updateAll)
				,3
			)
			.renderView('plain')
			.appendTo(self)
			
			self.side = $('<div></div>').addClass('side')
			self.chart_container = $('<div></div>').addClass('content chart')
			self.getForm4Day(0).renderView('full').appendTo(self.side)
		
			ledge()
			.addTile(self.chart_container, 10)
			.addTile(self.side, 4, true)
			.renderView('plain')
			.appendTo(self)		//appendTo does not return the bubble but the jQuery object!		

					
			//for some reason firefox needs the timeout =/
			window.setTimeout(function(){
				self.chart = nfp2hc(cycle, self.chart_container[0], null, self.selection_callback)								
			},800)

		},
	})
	return(self);
}


/*******************************************
 * @data?
 */

function cycle_form_bubble(){
	var self = bubble()
	self.class_name = 'form'
	self.form = $("<form></form>")
	self.items = []

	self.onsubmit = function(){}

	self.submit = function(){
		self.parent_bubble.updateDay(self.data.day)
	}
	
	self.getValue = function(){
		var values 	= {}
		for(var field_name in self.bubbles){
			values[field_name] = self.bubbles[field_name].getValue()
		}		
		return(values)
	}

	self.reset = function(){
		for(var field_name in self.bubbles) self.bubbles[field_name].reset()		
	}

	self.addView('full',{
		render : function(){	
			var	day		= self.data.day,
				parent	= self.parent_bubble || cycle_bubble()
						
			ledge()
			.addTile(
				button()
				.setData('&#x25C0;')
				.click(function(){parent.selectDay(day-1)})
				.renderView('plain')
				,1
			 )
			.addTile(
				content()
				.setData('Tag '+(day+1))
				.renderView('plain')
				,2
			)
			.addTile(
				button()
				.setData('&#x25B6;')
				.click(function(){parent.selectDay(day+1)})
				.renderView('plain')
				,1
			)
			.renderView('plain')
			.appendTo(self)
		
			self.form.appendTo(self)

			for(var index in self.bubbles){
				var item = self.bubbles[index].renderView('compact')
				ledge()
				.addTile(item)
				.renderView('plain')
				.appendTo(self.form)
			}
			
			ledge()
			.addTile(
				button()
				.setData('übernehmen')
				.renderView('plain')
				.click(self.submit)
				,2
			)
			.addTile(
				button()
				.setData('zurücksetzen')
				.renderView('plain')
				.click(self.reset)
				,2
			)
			.renderView('plain')
			.appendTo(self)
		}
	})
	
	self.onupdate = function(){	
		var	data	= self.data,
			day		= self.data.day,			
			parent	= self.parent_bubble

			
		var date = ""
		if(data.date == undefined || data.date == null){ // function schreiben für diesen check
		}else{
			with(data.date){
				date = two(getDate())+'.'+two(getMonth()+1)+'.'+getFullYear()
			}
		}


		form_item_bubble()
		.addTo(self, "date")
		.setup({
			label	 	: 	"Datum",	
			field_name	: 	"date",
			filter		: 	function(x){
								var regex = /(\d+).(\d+).(\d+)/g,
									y=regex.exec(x)
								if(!y || y.length == 0) return(null)
								return(new Date(y[3],y[2]-1,y[1]))
							},
		})
		.setData(date)


		form_item_bubble()
		.addTo(self, "time")
		.setup({
			label	 	: "Uhrzeit",	
			field_name	: "time",
		})
		.setData(data.time)

		

		form_item_bubble()
		.addTo(self, "temperature")
		.setup({
			label	 	: "Temperatur(&degC)",	
			field_name	: "temperature",
			filter		: parseFloat,
		})
		.setData(data.temperature != null ? data.temperature.toFixed(2) : null)

		form_item_bubble()
		.addTo(self, "blood")
		.setup({
			label	 	: "Blutung",	
			field_name	: "blood",
			type		: "select",
			options		: {null: '\u00D7', 0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5'},
			filter		: parseInt
		})
		.setData(data.blood)



		form_item_bubble()
		.addTo(self, "slime")
		.setup({
			label	 	: 	"Schleim",	
			field_name	: 	"slime",
			type		: 	"select",	
			options		: 	{null: '\u00D7', 0: 't', 1: 'Ø', 2: 'f', 3: 'S', 4: 'S+'},
			filter		: parseInt
		})
		.setData(data.slime)



		form_item_bubble()
		.addTo(self, "hidden")
		.setup({
			label	 	: "Ausklammern",	
			field_name	: "hidden",
			type		: "checkbox",
			options		: ['\u2713']			
		})
		.setData(data.hidden)

	}
	
	return(self);
}


function form_item_bubble(id){
	var self = bubble()

	self.class_name	=	'item'
	self.input		= 	null

	self.onsetup = function(){	
		switch(self.config.type){
			case "checkbox":
				self.input = self.input || $('<div></div>')
				.addClass('checkbox')
			break;
			case "select":
				self.input = self.input || $('<input type="text">')
				.addClass('select')
				.attr('name', self.config.field_name)
			break
			default:
				var type	= self.config.type ? ' type="'+self.config.type+'" ' : ''

				self.input = self.input || $('<input '+type+' >')		//todo: soll setup widerholt möglich sein?
				.attr('name', self.config.field_name)				
			break
		}
		self.input.addClass('input')
	}

	self.onupdate = function(){
		switch(self.config.type){
			case "checkbox" :
				self.toggleOptions(self.value || self.data || false)
			break
			case "select" :
				self.input.val(self.config.options[self.value || self.data] || null)
			break
			default:
				self.input.val(self.value || self.data)
			break
		}
	}
	
	self.onreset = function(){
		switch(self.config.type){
			case "checkbox":
				self.toggleOptions(self.data || false)
			break
			case "select":
				self.input.val(self.config.options[self.data] || null)
			break
			default:
				self.input[0].value	= self.data || null
			break
		}
		self.input.change()
	}
	
	self.addView('compact',{
		render : function(){
			$('<label>'+self.config.label+'</label>').appendTo(self)


			
			self.input
			.change(function(event){
				event.stopImmediatePropagation()
				switch(self.config.type){
					case "checkbox":						
					break
					case "select":
						self.removeBubble()
						for(var index in self.config.options){
							var value = self.config.options[index]

							if(self.input.val().toUpperCase() == value.toUpperCase()){
								self.value = index
								self.input.val(value)
								return(null)							
							}
						}
						self.input.val(self.config.options[self.value != undefined ? self.value : null])								
					break
					default:
						self.value = this.value
					break
				}
			})
			.focus(function(){
				$('.focus').removeClass('focus')
				self.addClass('focus')
			})
			.appendTo(self)
						
			self.click(function(event){
				self.input.focus()	
				event.stopImmediatePropagation()

				switch(self.config.type){
					case "checkbox":
						self.toggleOptions()
					break
					case "select":
						self.toggleOptions()
					break
					default:
					break
				}		
			})
			
			self.focus(function(){self.input.focus()})
		}
	})
	
	self.toggleOptions = function(check){
		switch(self.config.type){
			case "checkbox":
				check = check 	!= undefined 
								? check 
								: self.value != undefined 
									? !self.value 
									: (self.data || false)		//first toggle
				self.input.toggleClass('checked', check)
				self.input.text(check ? self.config.options[0] || '\u2713' : self.config.options[1] || '')
				self.value = check
			break
			case "select":
				options()
				.setData(self.config.options)
				.addTo(self)
				.renderView('horizontal')
				.appendTo(self)					
			break
			default:
			break
		}
	}

		
	self.getValue = function(){	
		var filter = self.config.filter || function(x){return(x)}
		return(filter(self.value != undefined ? self.value : self.data) || null )
	}

	self.setValue = function(value){	
		self.input.val(value)
		self.input.change()
		return(self)
	}

	return(self);
}

function options(){
	self = bubble()

	self.class_name	=	'options'

	self.addView('horizontal', {
		render: function(){
			var	parent		=	self.getParentBubble(),
				cval		= 	parent.getValue(),
				ldg			=	ledge()

			for(var i in self.data){
				var index	= i,
					value	= self.data[i]

				function fnc(i,v){
					return function(event){
						l(parent)
						event.stopImmediatePropagation()
						parent.setValue(v)
						parent.removeBubble()
					}
				}
			
				ldg.addTile(
					button()
					.setData(value)
					.addClass('option')
					.addClass(cval == value ? 'selected' : '')
					.renderView('plain')
					.click(fnc(index, value))
				)
			}

			ldg
			.renderView('plain')
			.appendTo(self)
		}
	})

	return(self)
}


$(function(){	
 	calendar_bubble().setData(nfp_test).renderView('compact').appendTo($("body"))	
	height2xem(60)
	$(window).resize(function(){height2xem(60)})
});


	
