// 最小整数
const MIN = 0;
// 最大整数
const MAX = Number.MAX_SAFE_INTEGER;
// 在最小值和最大值之间的取值浮标位置

/**
 * 给定最小值和最大值，取一个中间位置
 * @param {Object} [options] 选项
 * @param {number} [options.min] 最小值
 * @param {number} [options.max] 最大值
 * @returns {number|false} 返回计算出来的值
 */
export function getOrderNumber(options = {}){
	let {min, max} = options;
	if(typeof min === 'undefined' || min < MIN) min = MIN;
	if(typeof max === 'undefined' || max > MAX) max = MAX;
	min = Math.ceil(min);
	max = Math.floor(max);
	let step = 0.5;
	if(max === MAX){
		step = 100 / (max - min);
	}
	let ret = Math.round(min + (max - min) * step);

	if(ret <= min){
		ret = min + 1;
	}
	if(ret >= max){
		return false;
	}
	return ret;
}

/**
 * 给定一个最小值和最大值
 * 在最小值和最大值区间内返回N个顺序数值
 * @param {Object} [options] 选项
 * @param {number} [options.min] 最小值
 * @param {number} [options.max] 最大值
 * @param {number} [options.count] 返回多少个数值
 */
export function normalizeOrderList(options = {}){
	let count = options.count;
	if(!count) count = 1;
	let ret = [];
	for(let i = 0; i < count; i++) {
		let orderNum = getOrderNumber({
			min: ret[i - 1] || options.min,
			max: options.max
		});
		if(orderNum === false){
			return false;
		}
		ret.push(orderNum);
	}
	return ret;
}
