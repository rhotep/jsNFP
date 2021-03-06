// add a href around bubbles
// add addBubble-function. Caller übergeben, dann kann man auch direkte links verarbeiten.

function bubble(){
	// create jquery objects as base bubble:	

	var	self = $('<div></div>').addClass('bubble')

	self.class_name		= ''
	self.views			= {}
	self.current_view	= ''
	self.data			= {}
	self.config			= {}
	self.bubbles		= {}
	self.parent_bubble	= null
	self.value			= null
	
	//hooks:
	self.onburst	= function(){}
	self.onupdate	= function(){}
	self.onsetup	= function(){}
	self.oninput	= function(){}
	self.onreset	= function(){}
	
	self.addView = function(name, view){
		self.views[name] 	= view
		self[name]			= {}
		self[name].render 	= function(){self.renderView(name)}		
		return(self)
	}
	
	self.clear = function(){
		function clear(obj){
			obj = $(obj)
			if(obj.hasClass('bubble')){
				obj.detach()			//todo:einschränken auf bubble-sammlung
			}else{
				obj.contents().each(function(){clear(this)})
				obj.remove()
			}
		}
		self.contents().each(function(){clear(this)})
	}
		
	self.renderView = function(name){
		self.update(function(){
			self.removeClass()
			self.clear()				//todo:add loading default?
			self
			.attr('class', '')
			.addClass('bubble')	
			.addClass(self.class_name)
			.addClass(name)
			self.views[name].render()
			self.current_view = name
		})
		return(self)
	}

	self.addBubble = function(bubble, id){
		if(id == undefined) return(false)
		if(!self.bubbles[id]){
			self.bubbles[id] = bubble
			bubble.setParentBubble(self)
		}
		return(self.bubbles[id])
	}

	self.setBubble = function(id, bubble){
		self.bubbles[id] = bubble
		bubble.parent_bubble = self
		return(bubble)
	}

	self.getBubble = function(id){
		return(self.bubbles[id]||null)
	}

	self.removeBubble = function(id){
		id = id || null
		if(self.bubbles[id]) self.bubbles[id].remove()
		self.bubbles[id] = null
		return(self)
	}

	self.clearBubbles = function(){
		for(id in self.bubbles)	self.removeBubble(id)
	}

	self.addTo = function(bubble, id){
		return(bubble.addBubble(self, id))
	}

	self.setParentBubble = function(bubble){
		self.parent_bubble = bubble
		return(self)
	}

	self.getParentBubble = function(){
		return(self.parent_bubble)
	}

	self.removeParent = function(){
		self.parent_bubble = null
		return(self)
	}

	// data management:
	self.data = {}
	self.updated=true

	self.setData = function(data){	//there is no check wether the data actually changes
		if(data != self.data){
			self.data = data
			self.onupdate() 		//todo: only if new!
		}
		return(self)
	}

	self.setup = function(config){ //similar to setData but only for configuration data
		self.config = config || null
		self.onsetup()
		return(self)
	}

	self.reset = function(){
		self.value = null
		self.onreset()
		return(self)
	}

	self.getValue = function(){			//overwrite if needed
		return(self.value||null)
	}

	self.setValue = function(value){	//overwrite if needed
		self.value = value
		return(self)
	}

	self.source = null;
	self.force_reload = 0;

	self.setSource = function(url, cb){
		self.source = {"url":url, "callback":cb};
		self.id = encodeURIComponent(self.source.url);		
		return(self);
	}

	self.unsetSource = function(){
		self.source = null;
		return(self);
	}

	self.update = function (cb){ // Check if allways neccessary!
		self.addClass('updating');
		if(self.source != null){
			if(self.request == undefined){
				self.request = $.get(self.source.url ,null, function(data, textStatus, jqXHR){
					self.data = self.source.callback(data);
					if(cb!=null) cb();
					if(self.force_reload > 0){
						window.setTimeout(self.update, self.force_reload);
					}
					self.removeClass('updating');
					delete self.request;
				});				
			}
		}else{
			if(cb!=undefined) cb();
			self.removeClass('updating');
			self.onupdate();						//todo only if data is new!
		}
		return(self);
	}

	self.spanViewTo = function(view, target){
		//backup css properties:
		var	bak_css_height 		= target.get(0).style.height,
			bak_css_width		= target.get(0).style.width


		//fix height and width:
		target.css('height', target.height())
		target.css('width', target.width())
		
		var	bak_contents	= target.contents(),	//backup target
			bak_next_obj 	= self.next(),			//save next
			bak_parent_obj 	= self.parent(),		//save the parent		
			bak_view		= self.current_view		//backup current view

		target.children().detach()					//empty target
		target.append(self)				
		
		self.renderView(view).addClass('spanned')
		
		self.onburst = function(){			
			self.parent().children().detach()		//empty target			
			bak_contents.appendTo(target)			//restore original content
						
			if(bak_next_obj.length == 0){			//put self back on original position				
				self.appendTo(bak_parent_obj)				
			}else{
				self.insertAfter(bak_next_obj)
			}
			self.renderView(bak_view)
	
			//restore css properties:
			target.css('height', 	bak_css_height)
			target.css('width', 	bak_css_width)
		}		
		return(self);
	}

	self.slideViewInto = function(name, config, dir){ //restore funktioniert vermutlich nicht richtig		

		config = config || $('body')
		if(!$.isPlainObject(config)) config.container = config

		 function slide_fnc(){
			var	container 	= config.container,
				dir_in		= dir || config.dir_in	|| config.dir	|| config.dir_out || 'left',
				dir_out		= dir || config.dir_out || config.dir	|| config.dir_in || 'left',
				distance	= config.distance || 0,
				duration	= config.duration || 400,
				easing		= config.easing || 'swing',
				complete	= config.complete || function(){}


		
			if(
					$(config.container).get(0).slide_stack 
				&& 	$(config.container).get(0).slide_stack.length > 0
			){
				duration = Math.round(duration / $(config.container).get(0).slide_stack.length)
			}
			
			//backup properties of the container
			var padding			= {
				top		: parseInt(container.css('padding-top')),
				left	: parseInt(container.css('padding-left')),
				right	: parseInt(container.css('padding-right')),
				bottom	: parseInt(container.css('padding-bottom')),
			}
			var width			= container.innerWidth(),
				height			= container.innerHeight(),
				position		= container.css('position'),			//calculated position
				style_pos		= container.get(0).style.position,		//set position
				overflow		= container.css('overflow'),			//calcualted overflow
				style_over		= container.get(0).style.overflow,		//set overflow
				contents		= container.contents()			
	
			// calculated position and set position can be different when position:inherit is set or nothing at all, 
			// same for overflow
	
			/*
				The sliding divs within the container use position:absolute,
				for that to work properly the container itself must not use position:satic.					
			*/
			if(position=='static') container.css({position: 	'relative'})
			/*
				The new content is placed into the container but outside its boundries,
				thus its overflow should not be visble.
			*/				
			container.css({overflow: 	'hidden'})	
			/*
				The content (old and new) is places in divs (s. below) that use position:absolute.
				The spacer prevents the container from shrinkingto nothing:
			*/	
			var spacer	= $('<div></div>').css({
				position: 	'static',
				width:		width-padding.left-padding.right,
				height:		height-padding.top-padding.bottom,
			})	
			/*
				The two divs slide_in and slide_out are used to slide the content in resp. out.
			*/
			var slide_out	= spacer.clone()
				.css({
					position: 'absolute',
					top:0,
					left:0,
					'padding-top': padding.top,
					'padding-left':padding.left,
					'padding-right': padding.right,
					'padding-bottom': padding.bottom,
					'z-index': 0,
				})
	
			var slide_in	= slide_out.clone()
				.css({
					'z-index': 1,
				})
	
			switch(dir_in){	//position the slider just outside the container on the appropriate side
				case 'up':		slide_in.css({top:		height+distance}); 	break;
				case 'left': 	slide_in.css({left:		width+distance});	break;
				case 'right': 	slide_in.css({left:		-width-distance});	break;
				case 'down': 	slide_in.css({top:		-height-distance});	break;
			}
					
	
			contents
			.detach()									// detach the content
			.clone().appendTo(slide_out)				// put clones into the slider that slides out
	
			self.renderView(name).appendTo(slide_in)	// put new content on the slider that slides in
	
			container.append(spacer).append(slide_out).append(slide_in) //append both sliders to the container
	
			/*
				As of now the container contains nothing but the spacer an the two slider divs.
				The new content lies in slide_in, the clones of the original content of the container lies in slide_out
			*/

			var out = {}	

			switch(dir_out){
				case 'up':		out = {top: 	-height-distance};	break;
				case 'left': 	out = {left: 	-width-distance};	break;
				case 'right': 	out = {left:	width+distance};	break;
				case 'down': 	out = {top:	 	height+distance};	break;
			}
		
			slide_out.animate(out, duration, easing, function(){
				slide_out.remove()				//remove the slider with cloned original content, after it slid out.
			})
			slide_in.animate({left: 0, top: 0}, duration, easing, function(){
				self.appendTo(container)		// move the new content into the container
				spacer.remove()					// remove the spacer
				slide_in.remove()				// remove the slider
				container.css({					// restore the original styles of the container
					position: style_pos,
					overflow: style_over,
				})
			
				if(
						$(config.container).get(0).slide_stack 
					&& 	$(config.container).get(0).slide_stack.length > 0
				){
					$(config.container).get(0).slide_stack.shift()()
				}else{
					$(config.container).get(0).slide_stack = null
				}
				if(complete != undefined && typeof(complete) == 'function') complete() // call callback, when slide is over		
			})

		}

		$(config.container).get(0).slide_stack = $(config.container).get(0).slide_stack || null
	
		if($(config.container).get(0).slide_stack == null){			//there is no slide running on this container
			$(config.container).get(0).slide_stack = []
			slide_fnc()
		}else{														//there is a slide running on this container
			$(config.container).get(0).slide_stack.push(slide_fnc)
		}



		self.onburst = function(){			
			self.parent().children().detach()		//empty target			
			bak_contents.appendTo(target)			//restore original content
						
			if(bak_next_obj.length == 0){			//put self back on original position				
				self.appendTo(bak_parent_obj)				
			}else{
				self.insertAfter(bak_next_obj)
			}
			self.renderView(bak_view)			
		}		
		return(self)
	}

	
	self.swap = function(target){
		self.swap = $(target).replaceWith(self)
	}
	
	self.burst = function(){
		self.onburst()
		return(self);
	}
	
	
	
// 	// planting, blooming, fading:
// 
// 	function plant(){
// 		self.full.hide()
// 		self.back.hide()
// 		self.compact.show()
// 		self.update(function(){
// 			self.compact.rerender()
// 			self.onplant()
// 		});
// 	}
// 
// 	self.plantInto = function(pot){
// 		self.appendTo(pot)
// 		plant()
// 		return(self)		
// 	}
// 
// 	self.plantAfter = function(sibling){
// 		self.insertAfter(sibling)
// 		plant()
// 		return(self)	
// 	}
// 
// 	self.setScope = function(stick){ 				//set where to render a blossom to.
// 		self.scope = $(stick);
// 		return(self);
// 	}
// 
// 	self.bloom = function(target){
// 		if(self.scope == undefined){
// 			self.scope = $("body");
// 		}
// 
// 		self.scope_bak	= self.scope.children();	//backup scope
// 		self.scope.children().detach();				//empty scope
// 		self.prev_obj = self.prev();				//save prev
// 		self.parent_obj = self.parent();			//save the parent
// 		self.scope.append(self);				
// 
// 		self.compact.hide()
// 		self.back.show()
// 		self.full.show()
// 	
// 		self.update(function(){
// 			self.back.rerender();
// 			self.full.rerender();
// 			self.updated = false;
// 			self.onbloom()
// 		});
/*
		
		return(self);
	}*/
/*
	self.burst = function(){
		self.full.hide()
		self.back.hide()
		self.compact.show()

		if( self.scope_bak != undefined){
			self.scope.children().detach();
			self.scope_bak.appendTo(self.scope);
		}

		if($(self.prev_obj).length == 0){
			self.plantInto(self.parent_obj);
		}else{
			self.plantAfter(self.prev_obj);
		}
		return(self);
	}


	// display:	
	
	self.compact.render = function(){}
	self.back.render	= function(){}
	self.full.render	= function(){}



	function rerender(){
		if(self.updated){
			this.children().remove()
			this.render()
		}
		return(self)
	}

	self.compact.rerender	= rerender
	self.full.rerender		= rerender
	self.back.rerender		= rerender*/

	/*tabbing

	self.tab_items = []

	self.focus(function(event){
		if(self.tab_items.length>0){
			event.preventDefault()
			self.tab_items[0].focus()
		}
	})

	self.addTabItem = function(item, tabindex){		
		item.keypress(function(event){
			if(
				(!event.shiftKey && event.keyCode == 9)
				||event.keyCode == 13
			){
				event.preventDefault()
				self.tabItemNext()	
			}
			
			if( event.shiftKey && event.keyCode == 9 ){
				event.preventDefault()	
				self.tabItemBack()
			}	
		})
		tabindex = tabindex || self.tab_items.length
		self.tab_items.splice(tabindex,0,item)		
		return(self)
	}

	self.getFocusTabItem = function(){
		var i = self.tab_items.length
		while(i){
			i--
			if(self.tab_items[i].find(':focus').length>0) return(i)				
		}
		return(-1)
	}

	self.tabItemNext = function(){
		var index = self.getFocusTabItem()
		self.tab_items[(index+1) % self.tab_items.length].focus()
		return(self)
	}

	self.tabItemBack = function(){
		var index = self.getFocusTabItem()
		self.tab_items[(index-1+self.tab_items.length) % self.tab_items.length].focus()
		return(self)
	}

	*/

	return(self);
}






