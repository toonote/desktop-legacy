import cubicInOut from 'eases/cubic-in-out';

let scroll = {};

class TooAnimate{
	constructor(options){
		this.start = options.start;
		this.end = options.end;
		this.during = options.during;
		this.onTick = options.onTick;
		this._value = this.start;
		this.doAnimate();
	}
	doAnimate(){
		let delta = this.end - this.start;
		let startTime;
		let tick = (time)=>{
			if(!startTime) startTime = time;
			let progress = cubicInOut((time - startTime) / this.during);
			if(progress > 1) progress = 1;
			this._value = progress * delta + this.start;
			this.onTick(this._value);
			if(progress < 1){
				requestAnimationFrame(tick);
			}
		};
		requestAnimationFrame(tick);
	}
}

scroll.doScroll = ($target, end, during) => {
	var tooAnimate = new TooAnimate({
		start:$target.scrollTop,
		end:end,
		during:during,
		onTick: function(value){
			$target.scrollTop = value;
		}
	});
};

export default scroll;
