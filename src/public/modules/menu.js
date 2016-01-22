import util from './util';
import note from './note';
import meta from './meta';
import Menu from '../api/menu/index';

let self = {};
let menu = new Menu(util.platform);

self.on = menu.on.bind(menu);

self.off = menu.off.bind(menu);

self.trigger = menu.trigger.bind(menu);

export default self;
