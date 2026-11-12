import {spawn} from 'node:child_process';
const py=spawn('python',['-m','uvicorn','backend.app:app','--host','127.0.0.1','--port','8000'],{stdio:'inherit'});
const web=spawn('node',['node_modules/vite/bin/vite.js',...process.argv.slice(2)],{stdio:'inherit'});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{py.kill(sig);web.kill(sig);process.exit(0)});
web.on('exit',code=>{py.kill();process.exit(code??0)});
