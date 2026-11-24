(() => {
 const db=window.getSupabase();
 const form=document.querySelector('#studentForm'), status=document.querySelector('#status'), info=document.querySelector('#deadlineInfo'), countdown=document.querySelector('#countdown'), btn=document.querySelector('#submitBtn');
 let deadline=null, loaded=false, busy=false;
 function message(s,err=false){status.textContent=s;status.className='status '+(err?'error':'ok');}
 function updateClock(){const ms=deadline?deadline-Date.now():0;const open=loaded&&ms>0;btn.disabled=!open||busy;info.textContent=!loaded?'Checking deadline…':!deadline?'Submissions closed: admin has not set a deadline.':open?'Submissions are open until '+new Date(deadline).toLocaleString():'Deadline passed: submissions are closed.';countdown.textContent=open?`Time left: ${Math.floor(ms/86400000)}d ${Math.floor(ms%86400000/3600000)}h ${Math.floor(ms%3600000/60000)}m ${Math.floor(ms%60000/1000)}s`:'';}
 async function loadDeadline(){const {data,error}=await db.from('portal_settings').select('deadline_at').eq('id',1).single();loaded=!error;deadline=data?.deadline_at?new Date(data.deadline_at).getTime():null;if(error)message('Could not load deadline: '+error.message,true);updateClock();}
 loadDeadline();setInterval(updateClock,1000);setInterval(loadDeadline,30000);
 form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 await loadDeadline();if(!deadline||deadline<=Date.now()){message('Submission is closed. Ask admin to extend the deadline.',true);return;}
 const f=form.elements.assignment.files[0];if(!f||!/\.(doc|docx)$/i.test(f.name)){message('Only .doc or .docx files are allowed.',true);return;}
 if(f.size<1||f.size>10485760){message('File must be between 1 byte and 10 MB.',true);return;}
 const username=form.elements.username.value.trim(),sap_id=form.elements.sap_id.value.trim(),assignment_title=form.elements.assignment_title.value.trim();
 if(!username||!sap_id||!assignment_title){message('Fill in every field.',true);return;}
 busy=true;updateClock();message('Uploading file…');
 // Unique path, never overwrite. Anon users intentionally cannot read/delete other students' files.
 const path=`student/${crypto.randomUUID()}.${f.name.toLowerCase().endsWith('.docx')?'docx':'doc'}`;
 try{
  const mime=f.name.toLowerCase().endsWith('.docx')?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'application/msword';
  const up=await db.storage.from('assignments').upload(path,f,{upsert:false,contentType:mime});
  if(up.error)throw new Error('Storage upload failed: '+up.error.message);
  message('File uploaded. Saving submission record…');
  const ins=await db.from('submissions').insert({username,sap_id,assignment_title,file_path:path,file_name:f.name,file_size:f.size});
  if(ins.error)throw new Error('Database record failed: '+ins.error.message+' (File may remain in storage; ask admin to clean up.)');
  message('Assignment submitted successfully!');form.reset();
 }catch(err){message(err.message,true);}finally{busy=false;updateClock();}
 });
})();
