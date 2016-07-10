function slide(config){ 
	slide_fnc = function(){
		var	container 	= config.container,
			obj			= config.obj, 
			dir_in		= config.dir_in	|| config.dir	|| config.dir_out || 'left',
			dir_out		= config.dir_out || config.dir	|| config.dir_in || 'left',
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
		.detach()						// detach the content, will be returned for later use
		.clone().appendTo(slide_out)	// put clones into the slider that slides out
	
		obj.appendTo(slide_in)			// put new content on the slider that slides in
	
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
			slide_out.remove()	//remove the slider with cloned original content, after it slid out.
		})
		slide_in.animate({left: 0, top: 0}, duration, easing, function(){
			obj.appendTo(container)			// move the new content into the container
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

		return(contents) //return the slid out content
	}
	
	$(config.container).get(0).slide_stack = $(config.container).get(0).slide_stack || null
	
	if($(config.container).get(0).slide_stack == null){	//there is no slide running on this container
		$(config.container).get(0).slide_stack = []
		slide_fnc()
	}else{														//there is a slide running on this container
		$(config.container).get(0).slide_stack.push(slide_fnc)
	}
}		

function height2xem(x){	
	$("body").css('font-size', $(window).height()/x +'px')
}



function two(a){			
	return(a<10 ? '0'+a: a);
}


function date(d){
	if(d == undefined || d == null) return('?')
	return(two(d.getDate())+'.'+two(d.getMonth()+1)+'.'+d.getFullYear());
}

function fit2screen(){
	var font_size = parseInt($("body").css('font-size'))
	while($("body").innerHeight() >= window.innerHeight && font_size > 0){
		font_size--
		$("body").css('font-size', font_size)		
	}
}




function l ( O )
  {
    var msg = O ;

    var fn     = String( l.caller );
    var origin = fn.substring( fn.search(/function/)+9 , fn.search(/\(/) );

    console.groupCollapsed( msg +" [@"+ origin +"]" );
    console.dir(msg);
    console.groupEnd();

    return O ;
  }
