let env = {};

env.os = 'osx';
if(process.platform === 'win32'){
	env.os = 'windows';
}

export default env;
