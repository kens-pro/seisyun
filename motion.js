(() => {
  'use strict';
  const story=document.querySelector('.scroll-story');
  if(!story)return;
  const panels=[...story.querySelectorAll('.story-panel')];
  const dots=[...story.querySelectorAll('[data-story-dot]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const room=matchMedia('(min-height: 651px)');
  const mobile=matchMedia('(max-width: 760px)');
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>n*n*(3-2*n);
  let enabled=false,scheduled=false,start=0,distance=1,stageWidth=0,stageHeight=0;
  function measure(){
    if(!enabled)return;
    const stage=story.querySelector('.story-stage');
    start=story.getBoundingClientRect().top+window.scrollY;
    stageWidth=stage.clientWidth;stageHeight=stage.clientHeight;
    distance=Math.max(1,story.offsetHeight-stageHeight);
  }
  function draw(){
    scheduled=false;if(!enabled)return;
    const progress=clamp((window.scrollY-start)/distance);
    const time=progress*2.78;
    const current=Math.min(2,Math.floor(time)),local=time-current;
    story.dataset.progress=progress.toFixed(4);
    story.dataset.scene=String(current);
    story.classList.toggle('story-dark',time>=1.94);
    panels.forEach((panel,index)=>{
      const isCurrent=index===current,isPrevious=index===current-1&&local<.22;
      const phase=isCurrent?local:1;
      const entry=current===0?1:ease(clamp(local/.22));
      const opacity=isCurrent?entry:isPrevious?1-entry:0;
      const settled=ease(clamp((phase-.12)/.34));
      const outgoing=index<2?ease(clamp((phase-.83)/.17)):0;
      // Once the photograph has settled, keep its dimensions through the handoff.
      const shrink=settled;
      const scale=1-(mobile.matches?.10:.42)*shrink;
      const photo=panel.querySelector('.story-photo');
      // Alternate the photograph's side; mobile settles above the reading area.
      const x=mobile.matches?stageWidth*.05*shrink:index===1?stageWidth*.405*shrink:stageWidth*.015*shrink;
      const y=mobile.matches?stageHeight*.09*shrink:stageHeight*.105*shrink;
      // A portrait opening becomes a wide photograph on phones, revealing the group.
      if(mobile.matches)photo.style.height=(stageHeight*(.71-.41*shrink)).toFixed(2)+'px';
      else photo.style.removeProperty('height');
      const arriving=isCurrent?(1-entry)*stageHeight*.075:0;
      photo.style.transform=`translate3d(${x.toFixed(2)}px,${(y+arriving).toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
      panel.style.opacity=opacity.toFixed(4);
      panel.style.zIndex=String(index+1);
      // Only the current scene can show text; outgoing photographs may still overlap.
      const text=isCurrent?ease(clamp((settled-.62)/.38))*(1-outgoing)*opacity:0;
      const copy=panel.querySelector('.story-copy');
      copy.style.opacity=text.toFixed(4);
      copy.style.transform=`translate3d(0,${((1-text)*22).toFixed(2)}px,0)`;
      const word=panel.querySelector('.story-word');
      word.style.opacity=(text*.86).toFixed(4);
      word.style.transform=`translate3d(0,${((1-text)*35).toFixed(2)}px,0)`;
    });
    dots.forEach((dot,index)=>dot.classList.toggle('is-current',index===current));
  }
  function requestDraw(){
    if(!enabled||scheduled)return;
    // No loop. Paint only on input; off-screen sections keep their last state.
    const top=window.scrollY-start;
    if(top < -stageHeight || top > distance+stageHeight)return;
    scheduled=true;requestAnimationFrame(draw);
  }
  function configure(){
    enabled=!reduced.matches&&room.matches&&'requestAnimationFrame' in window;
    story.classList.toggle('story-enhanced',enabled);
    if(enabled){measure();draw();}
    else{
      story.classList.remove('story-dark');
      delete story.dataset.progress;delete story.dataset.scene;
      for(const panel of panels){panel.removeAttribute('style');panel.querySelectorAll('.story-photo,.story-copy,.story-word').forEach(el=>el.removeAttribute('style'));}
      dots.forEach(dot=>dot.classList.remove('is-current'));
    }
  }
  window.addEventListener('scroll',requestDraw,{passive:true});
  window.addEventListener('resize',configure,{passive:true});
  reduced.addEventListener('change',configure);room.addEventListener('change',configure);mobile.addEventListener('change',configure);
  window.addEventListener('load',()=>{measure();draw();},{once:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){measure();draw();}});
  configure();
})();
