(()=>{var a={};a.id=7802,a.ids=[7802],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3055:(a,b,c)=>{"use strict";c.r(b),c.d(b,{GlobalError:()=>F.a,__next_app__:()=>L,handler:()=>N,pages:()=>K,routeModule:()=>M,tree:()=>J});var d=c(1619),e=c(12446),f=c(87945),g=c(23423),h=c(25632),i=c(13378),j=c(41436),k=c(16443),l=c(10744),m=c(31982),n=c(24044),o=c(14866),p=c(47262),q=c(14081),r=c(56617),s=c(27898),t=c(261),u=c(72281),v=c(42438),w=c(26713),x=c(90704),y=c(99505),z=c(42245),A=c(77730),B=c(75982),C=c(36090),D=c(86439),E=c(15958),F=c.n(E),G=c(48094),H=c(52711),I={};for(let a in G)0>["default","tree","pages","GlobalError","__next_app__","routeModule","handler"].indexOf(a)&&(I[a]=()=>G[a]);c.d(b,I);let J={children:["",{children:["admin",{children:["fellowship",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(c.bind(c,39019)),"/home/ubuntu/ut-os-wave1/ubuntu-town-web/src/app/admin/fellowship/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(c.bind(c,28696)),"/home/ubuntu/ut-os-wave1/ubuntu-town-web/src/app/layout.tsx"],"global-error":[()=>Promise.resolve().then(c.t.bind(c,15958,23)),"next/dist/client/components/builtin/global-error.js"],"not-found":[()=>Promise.resolve().then(c.t.bind(c,93808,23)),"next/dist/client/components/builtin/not-found.js"],forbidden:[()=>Promise.resolve().then(c.t.bind(c,76737,23)),"next/dist/client/components/builtin/forbidden.js"],unauthorized:[()=>Promise.resolve().then(c.t.bind(c,51668,23)),"next/dist/client/components/builtin/unauthorized.js"]}]}.children,K=["/home/ubuntu/ut-os-wave1/ubuntu-town-web/src/app/admin/fellowship/page.tsx"],L={require:c,loadChunk:()=>Promise.resolve()},M=new e.AppPageRouteModule({definition:{kind:f.RouteKind.APP_PAGE,page:"/admin/fellowship/page",pathname:"/admin/fellowship",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:J},distDir:".next",relativeProjectDir:""});async function N(a,b,e){var E;let I="/admin/fellowship/page";"/index"===I&&(I="/");let O=(0,i.getRequestMeta)(a,"postponed"),P=(0,i.getRequestMeta)(a,"minimalMode"),Q=await M.prepare(a,b,{srcPage:I,multiZoneDraftMode:!1});if(!Q)return b.statusCode=400,b.end("Bad Request"),null==e.waitUntil||e.waitUntil.call(e,Promise.resolve()),null;let{buildId:R,query:S,params:T,parsedUrl:U,pageIsDynamic:V,buildManifest:W,nextFontManifest:X,reactLoadableManifest:Y,serverActionsManifest:Z,clientReferenceManifest:$,subresourceIntegrityManifest:_,prerenderManifest:aa,isDraftMode:ab,resolvedPathname:ac,revalidateOnlyGenerated:ad,routerServerContext:ae,nextConfig:af,interceptionRoutePatterns:ag}=Q,ah=U.pathname||"/",ai=(0,t.normalizeAppPath)(I),{isOnDemandRevalidate:aj}=Q,ak=M.match(ah,aa),al=!!aa.routes[ac]&&(M.isDev||(0,d.isRouteCacheOwner)(ac,M.cacheOwner,aa.routes[ac])),am=!!(ak||al||aa.routes[ai]),an=a.headers["user-agent"]||"",ao=(0,w.getBotType)(an),ap=(0,r.isHtmlBotRequest)(a),aq=(0,i.getRequestMeta)(a,"isPrefetchRSCRequest")??"1"===a.headers[v.NEXT_ROUTER_PREFETCH_HEADER],ar=(0,i.getRequestMeta)(a,"isRSCRequest")??(0,o.f)(a.headers[v.RSC_HEADER]),as=(0,u.getIsPossibleServerAction)(a),at=(0,n.checkIsAppPPREnabled)(af.experimental.ppr)&&(null==(E=aa.routes[ai]??aa.dynamicRoutes[ai])?void 0:E.renderingMode)==="PARTIALLY_STATIC",au=!1,av=!1,aw=at?O:void 0,ax=at&&ar&&!aq,ay=(0,i.getRequestMeta)(a,"segmentPrefetchRSCRequest"),az=!an||(0,r.shouldServeStreamingMetadata)(an,af.htmlLimitedBots);ap&&at&&(am=!1,az=!1);let aA=!0===M.isDev||!am||"string"==typeof O||ax,aB=ap&&at,aC=null;ab||!am||aA||as||aw||ax||(aC=ac);let aD=aC;!aD&&M.isDev&&(aD=ac),M.isDev||ab||!am||!ar||ax||(0,l.d)(a.headers);let aE={...G,tree:J,pages:K,GlobalError:F(),handler:N,routeModule:M,__next_app__:L};Z&&$&&(0,q.setReferenceManifestsSingleton)({page:I,clientReferenceManifest:$,serverActionsManifest:Z,serverModuleMap:(0,s.createServerModuleMap)({serverActionsManifest:Z})});let aF=a.method||"GET",aG=(0,h.getTracer)(),aH=aG.getActiveScopeSpan();try{let d=M.getVaryHeader(ac,ag);b.setHeader("Vary",d);let g=async(c,d)=>{let e=new m.NodeNextRequest(a),f=new m.NodeNextResponse(b);return M.render(e,f,d).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=aG.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==j.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${aF} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${aF} ${a.url}`)})},l=async({span:d,postponed:f,fallbackRouteParams:h})=>{let j={query:S,params:T,page:ai,sharedContext:{buildId:R},serverComponentsHmrCache:(0,i.getRequestMeta)(a,"serverComponentsHmrCache"),fallbackRouteParams:h,renderOpts:{App:()=>null,Document:()=>null,pageConfig:{},ComponentMod:aE,Component:(0,k.T)(aE),params:T,routeModule:M,page:I,postponed:f,shouldWaitOnAllReady:aB,serveStreamingMetadata:az,supportsDynamicResponse:"string"==typeof f||aA,buildManifest:W,nextFontManifest:X,reactLoadableManifest:Y,subresourceIntegrityManifest:_,serverActionsManifest:Z,clientReferenceManifest:$,setIsrStatus:null==ae?void 0:ae.setIsrStatus,dir:c(33873).join(process.cwd(),M.relativeProjectDir),isDraftMode:ab,isRevalidate:am&&!f&&!ax,botType:ao,isOnDemandRevalidate:aj,isPossibleServerAction:as,assetPrefix:af.assetPrefix,nextConfigOutput:af.output,crossOrigin:af.crossOrigin,trailingSlash:af.trailingSlash,previewProps:aa.preview,deploymentId:af.deploymentId,enableTainting:af.experimental.taint,htmlLimitedBots:af.htmlLimitedBots,devtoolSegmentExplorer:af.experimental.devtoolSegmentExplorer,reactMaxHeadersLength:af.reactMaxHeadersLength,multiZoneDraftMode:!1,incrementalCache:(0,i.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:af.experimental.cacheLife,basePath:af.basePath,serverActions:af.experimental.serverActions,...au?{nextExport:!0,supportsDynamicResponse:!1,isStaticGeneration:!0,isRevalidate:!0,isDebugDynamicAccesses:au}:{},experimental:{isRoutePPREnabled:at,expireTime:af.expireTime,staleTimes:af.experimental.staleTimes,cacheComponents:!!af.experimental.cacheComponents,clientSegmentCache:!!af.experimental.clientSegmentCache,clientParamParsing:!!af.experimental.clientParamParsing,dynamicOnHover:!!af.experimental.dynamicOnHover,inlineCss:!!af.experimental.inlineCss,authInterrupts:!!af.experimental.authInterrupts,clientTraceMetadata:af.experimental.clientTraceMetadata||[]},waitUntil:e.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:()=>{},onInstrumentationRequestError:(b,c,d)=>M.onRequestError(a,b,d,ae),err:(0,i.getRequestMeta)(a,"invokeError"),dev:M.isDev}},l=await g(d,j),{metadata:m}=l,{cacheControl:n,headers:o={},fetchTags:p}=m;if(p&&(o[A.NEXT_CACHE_TAGS_HEADER]=p),a.fetchMetrics=m.fetchMetrics,am&&(null==n?void 0:n.revalidate)===0&&!M.isDev&&!at){let a=m.staticBailoutInfo,b=Object.defineProperty(Error(`Page changed from static to dynamic at runtime ${ac}${(null==a?void 0:a.description)?`, reason: ${a.description}`:""}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),"__NEXT_ERROR_CODE",{value:"E132",enumerable:!1,configurable:!0});if(null==a?void 0:a.stack){let c=a.stack;b.stack=b.message+c.substring(c.indexOf("\n"))}throw b}return{value:{kind:x.CachedRouteKind.APP_PAGE,html:l,headers:o,rscData:m.flightData,postponed:m.postponed,status:m.statusCode,segmentData:m.segmentData},cacheControl:n}},n=async({hasResolved:c,previousCacheEntry:d,isRevalidating:g,span:h})=>{let j,k=!1===M.isDev,m=c||b.writableEnded;if(aj&&ad&&!d&&!P)return(null==ae?void 0:ae.render404)?await ae.render404(a,b):(b.statusCode=404,b.end("This page could not be found")),null;if(ak&&(j=(0,y.parseFallbackField)(ak.fallback)),j===y.FallbackMode.PRERENDER&&(0,w.isBot)(an)&&(!at||ap)&&(j=y.FallbackMode.BLOCKING_STATIC_RENDER),(null==d?void 0:d.isStale)===-1&&(aj=!0),aj&&(j!==y.FallbackMode.NOT_FOUND||d)&&(j=y.FallbackMode.BLOCKING_STATIC_RENDER),!P&&j!==y.FallbackMode.BLOCKING_STATIC_RENDER&&aD&&!m&&!ab&&V&&(k||!al)){let b;if((k||ak)&&j===y.FallbackMode.NOT_FOUND)throw new D.NoFallbackError;if(at&&!ar){let c="string"==typeof(null==ak?void 0:ak.fallback)?ak.fallback:k?ai:null;if(b=await M.handleResponse({cacheKey:c,req:a,nextConfig:af,routeKind:f.RouteKind.APP_PAGE,isFallback:!0,prerenderManifest:aa,isRoutePPREnabled:at,responseGenerator:async()=>l({span:h,postponed:void 0,fallbackRouteParams:k||av?(0,p.u)(ai):null}),waitUntil:e.waitUntil}),null===b)return null;if(b)return delete b.cacheControl,b}}let n=aj||g||!aw?void 0:aw;if(au&&void 0!==n)return{cacheControl:{revalidate:1,expire:void 0},value:{kind:x.CachedRouteKind.PAGES,html:z.default.EMPTY,pageData:{},headers:void 0,status:void 0}};let o=V&&at&&((0,i.getRequestMeta)(a,"renderFallbackShell")||av)?(0,p.u)(ah):null;return l({span:h,postponed:n,fallbackRouteParams:o})},o=async c=>{var d,g,h,j,k;let m,o=await M.handleResponse({cacheKey:aC,responseGenerator:a=>n({span:c,...a}),routeKind:f.RouteKind.APP_PAGE,isOnDemandRevalidate:aj,isRoutePPREnabled:at,req:a,nextConfig:af,prerenderManifest:aa,waitUntil:e.waitUntil});if(ab&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate"),M.isDev&&b.setHeader("Cache-Control","no-store, must-revalidate"),!o){if(aC)throw Object.defineProperty(Error("invariant: cache entry required but not generated"),"__NEXT_ERROR_CODE",{value:"E62",enumerable:!1,configurable:!0});return null}if((null==(d=o.value)?void 0:d.kind)!==x.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant app-page handler received invalid cache entry ${null==(h=o.value)?void 0:h.kind}`),"__NEXT_ERROR_CODE",{value:"E707",enumerable:!1,configurable:!0});let p="string"==typeof o.value.postponed;am&&!ax&&(!p||aq)&&(P||b.setHeader("x-nextjs-cache",aj?"REVALIDATED":o.isMiss?"MISS":o.isStale?"STALE":"HIT"),b.setHeader(v.NEXT_IS_PRERENDER_HEADER,"1"));let{value:q}=o;if(aw)m={revalidate:0,expire:void 0};else if(P&&ar&&!aq&&at)m={revalidate:0,expire:void 0};else if(!M.isDev)if(ab)m={revalidate:0,expire:void 0};else if(am){if(o.cacheControl)if("number"==typeof o.cacheControl.revalidate){if(o.cacheControl.revalidate<1)throw Object.defineProperty(Error(`Invalid revalidate configuration provided: ${o.cacheControl.revalidate} < 1`),"__NEXT_ERROR_CODE",{value:"E22",enumerable:!1,configurable:!0});m={revalidate:o.cacheControl.revalidate,expire:(null==(j=o.cacheControl)?void 0:j.expire)??af.expireTime}}else m={revalidate:A.CACHE_ONE_YEAR,expire:void 0}}else b.getHeader("Cache-Control")||(m={revalidate:0,expire:void 0});if(o.cacheControl=m,"string"==typeof ay&&(null==q?void 0:q.kind)===x.CachedRouteKind.APP_PAGE&&q.segmentData){b.setHeader(v.NEXT_DID_POSTPONE_HEADER,"2");let c=null==(k=q.headers)?void 0:k[A.NEXT_CACHE_TAGS_HEADER];P&&am&&c&&"string"==typeof c&&b.setHeader(A.NEXT_CACHE_TAGS_HEADER,c);let d=q.segmentData.get(ay);return void 0!==d?(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:z.default.fromStatic(d,v.RSC_CONTENT_TYPE_HEADER),cacheControl:o.cacheControl}):(b.statusCode=204,(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:z.default.EMPTY,cacheControl:o.cacheControl}))}let r=(0,i.getRequestMeta)(a,"onCacheEntry");if(r&&await r({...o,value:{...o.value,kind:"PAGE"}},{url:(0,i.getRequestMeta)(a,"initURL")}))return null;if(p&&aw)throw Object.defineProperty(Error("Invariant: postponed state should not be present on a resume request"),"__NEXT_ERROR_CODE",{value:"E396",enumerable:!1,configurable:!0});if(q.headers){let a={...q.headers};for(let[c,d]of(P&&am||delete a[A.NEXT_CACHE_TAGS_HEADER],Object.entries(a)))if(void 0!==d)if(Array.isArray(d))for(let a of d)b.appendHeader(c,a);else"number"==typeof d&&(d=d.toString()),b.appendHeader(c,d)}let s=null==(g=q.headers)?void 0:g[A.NEXT_CACHE_TAGS_HEADER];if(P&&am&&s&&"string"==typeof s&&b.setHeader(A.NEXT_CACHE_TAGS_HEADER,s),!q.status||ar&&at||(b.statusCode=q.status),!P&&q.status&&H.RedirectStatusCode[q.status]&&ar&&(b.statusCode=200),p&&b.setHeader(v.NEXT_DID_POSTPONE_HEADER,"1"),ar&&!ab){if(void 0===q.rscData){if(q.postponed)throw Object.defineProperty(Error("Invariant: Expected postponed to be undefined"),"__NEXT_ERROR_CODE",{value:"E372",enumerable:!1,configurable:!0});return(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:q.html,cacheControl:ax?{revalidate:0,expire:void 0}:o.cacheControl})}return(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:z.default.fromStatic(q.rscData,v.RSC_CONTENT_TYPE_HEADER),cacheControl:o.cacheControl})}let t=q.html;if(!p||P||ar)return(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:t,cacheControl:o.cacheControl});if(au)return t.push(new ReadableStream({start(a){a.enqueue(B.ENCODED_TAGS.CLOSED.BODY_AND_HTML),a.close()}})),(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:t,cacheControl:{revalidate:0,expire:void 0}});let u=new TransformStream;return t.push(u.readable),l({span:c,postponed:q.postponed,fallbackRouteParams:null}).then(async a=>{var b,c;if(!a)throw Object.defineProperty(Error("Invariant: expected a result to be returned"),"__NEXT_ERROR_CODE",{value:"E463",enumerable:!1,configurable:!0});if((null==(b=a.value)?void 0:b.kind)!==x.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant: expected a page response, got ${null==(c=a.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E305",enumerable:!1,configurable:!0});await a.value.html.pipeTo(u.writable)}).catch(a=>{u.writable.abort(a).catch(a=>{console.error("couldn't abort transformer",a)})}),(0,C.sendRenderResult)({req:a,res:b,generateEtags:af.generateEtags,poweredByHeader:af.poweredByHeader,result:t,cacheControl:{revalidate:0,expire:void 0}})};if(!aH)return await aG.withPropagatedContext(a.headers,()=>aG.trace(j.BaseServerSpan.handleRequest,{spanName:`${aF} ${a.url}`,kind:h.SpanKind.SERVER,attributes:{"http.method":aF,"http.target":a.url}},o));await o(aH)}catch(b){throw b instanceof D.NoFallbackError||await M.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"render",revalidateReason:(0,g.c)({isRevalidate:am,isOnDemandRevalidate:aj})},ae),b}}},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},26713:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/is-bot")},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},39019:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>j,dynamic:()=>i});var d=c(66422),e=c(59301),f=c(55031),g=c(22232),h=c(49567);let i="force-dynamic";async function j(){let a=await (0,f.S)(),{data:{user:b}}=await a.auth.getUser(),{data:c,error:i}=await a.rpc("is_hq"),j=(0,g.U)({user:b,isHq:c,rpcErrored:!!i,pathname:"/admin/fellowship"});return j.allowed||(0,e.redirect)(j.redirectTo),(0,d.jsx)(h.default,{})}},41025:a=>{"use strict";a.exports=require("next/dist/server/app-render/dynamic-access-async-storage.external.js")},49567:(a,b,c)=>{"use strict";c.d(b,{default:()=>d});let d=(0,c(44062).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/ubuntu/ut-os-wave1/ubuntu-town-web/src/app/admin/fellowship/AdminFellowshipClient.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/ubuntu/ut-os-wave1/ubuntu-town-web/src/app/admin/fellowship/AdminFellowshipClient.tsx","default")},53037:(a,b,c)=>{"use strict";c.d(b,{default:()=>m});var d=c(42140),e=c(14373),f=c(6e4);let g=["Free State","KwaZulu-Natal","Gauteng","Mpumalanga","Eastern Cape","Limpopo","Northern Cape","North West","Western Cape"],h={"Free State":["bethlehem","bloemfontein","botshabelo","ficksburg","harrismith","kroonstad","ladybrand","phuthaditjhaba","senekal","welkom"],"KwaZulu-Natal":["durban","greytown","harding","kokstad","newcastle","nquthu","pietermaritzburg","richards-bay"],Gauteng:["carletonville","ekurhuleni","johannesburg","kempton-park","pretoria","vanderbijlpark"],Mpumalanga:["acornhoek","bushbuckridge","emalahleni","nelspruit","sabie","witbank"],"Eastern Cape":["east-london","gqeberha","matatiele","mthatha"],Limpopo:["burgersfort","mokopane","polokwane","thohoyandou"],"Northern Cape":["de-aar","kimberley","springbok","upington"],"North West":["brits","klerksdorp","mafikeng","rustenburg"],"Western Cape":["cape-town","george","paarl","stellenbosch"]},i={pending:"#94a3b8",reviewing:"#60a5fa",shortlisted:"#eeb849",accepted:"#4ade80",rejected:"#f87171"},j={pending:"rgba(148,163,184,0.12)",reviewing:"rgba(96,165,250,0.12)",shortlisted:"rgba(238,184,73,0.12)",accepted:"rgba(74,222,128,0.12)",rejected:"rgba(248,113,113,0.12)"},k=["pending","reviewing","shortlisted","accepted","rejected"];function l(a,b){return a?a.length>b?a.slice(0,b)+"…":a:""}function m(){let[a,b]=(0,e.useState)(null),[c,m]=(0,e.useState)([]),[n,o]=(0,e.useState)(!0),[p,q]=(0,e.useState)("All"),[r,s]=(0,e.useState)(null),[t,u]=(0,e.useState)(null),[v,w]=(0,e.useState)(null),x=(0,e.useCallback)(async()=>{o(!0);let{data:a,error:b}=await f.N.from("builder_applications").select("*").order("total_score",{ascending:!1,nullsFirst:!1});!b&&a&&m(a.map(a=>({...a,province:function(a){for(let[b,c]of Object.entries(h))if(c.includes(a))return b;return"Unknown"}(a.town_slug)}))),o(!1)},[]);async function y(a,b){s(a);let{error:c}=await f.N.from("builder_applications").update({status:b}).eq("id",a);c||m(c=>c.map(c=>c.id===a?{...c,status:b}:c)),s(null),u(null)}let z=c.length,A=c.filter(a=>"pending"===a.status).length,B=c.filter(a=>"shortlisted"===a.status).length,C=c.filter(a=>"accepted"===a.status).length,D=c.filter(a=>"reviewing"===a.status).length,E=c.filter(a=>"rejected"===a.status).length,F="All"===p?c:c.filter(a=>a.province===p);return!1===a?(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("style",{children:`
          :root { --dark: #070509; --purple: #7649bc; --gold: #eeb849; }
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: var(--dark); color: #e8e0f5; font-family: 'Inter', system-ui, sans-serif; }
          .auth-wrapper {
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            padding: 2rem;
          }
          .auth-card {
            background: rgba(118,73,188,0.1); border: 1px solid rgba(118,73,188,0.35);
            border-radius: 20px; padding: 3rem 2.5rem; text-align: center; max-width: 420px; width: 100%;
          }
          .auth-icon { font-size: 3rem; margin-bottom: 1.25rem; }
          .auth-title { font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; }
          .auth-sub { color: #a898cc; font-size: 0.9rem; margin-bottom: 2rem; line-height: 1.5; }
          .auth-btn {
            display: inline-block; background: var(--purple); color: #fff;
            text-decoration: none; border-radius: 10px; padding: 0.75rem 2rem;
            font-weight: 700; font-size: 0.95rem; transition: background 0.2s;
          }
          .auth-btn:hover { background: #8f5ed4; }
        `}),(0,d.jsx)("div",{className:"auth-wrapper",children:(0,d.jsxs)("div",{className:"auth-card",children:[(0,d.jsx)("div",{className:"auth-icon",children:"\uD83D\uDD12"}),(0,d.jsx)("div",{className:"auth-title",children:"Sign In Required"}),(0,d.jsx)("p",{className:"auth-sub",children:"This admin dashboard is protected. Please sign in with an authorised Ubuntu Town account to continue."}),(0,d.jsx)("a",{href:"/login?next=/admin/fellowship",className:"auth-btn",children:"Sign In"})]})})]}):null===a?(0,d.jsx)("div",{style:{minHeight:"100vh",background:"#070509",display:"flex",alignItems:"center",justifyContent:"center",color:"#7649bc",fontSize:"1rem"},children:"Checking authentication…"}):(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("style",{children:`
        :root { --dark: #070509; --purple: #7649bc; --gold: #eeb849; --orange: #f5a340; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--dark); color: #e8e0f5; font-family: 'Inter', system-ui, sans-serif; }

        .admin-layout { min-height: 100vh; background: var(--dark); }

        /* TOPBAR */
        .topbar {
          background: rgba(7,5,9,0.97); border-bottom: 1px solid rgba(118,73,188,0.3);
          padding: 0.875rem 1.75rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          position: sticky; top: 0; z-index: 50;
        }
        .topbar-title { font-weight: 800; font-size: 1.05rem; color: #fff; }
        .topbar-sub { font-size: 0.72rem; color: var(--gold); letter-spacing: 0.08em; text-transform: uppercase; }
        .topbar-right { display: flex; align-items: center; gap: 0.75rem; }
        .refresh-btn {
          background: rgba(118,73,188,0.2); border: 1px solid rgba(118,73,188,0.4);
          color: #c4b8e0; border-radius: 8px; padding: 0.4rem 0.9rem;
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.2s;
        }
        .refresh-btn:hover { background: rgba(118,73,188,0.35); }

        /* SUMMARY */
        .summary-strip {
          display: flex; flex-wrap: wrap; gap: 1rem;
          padding: 1.5rem 1.75rem;
        }
        .summary-card {
          flex: 1; min-width: 120px; max-width: 180px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(118,73,188,0.2);
          border-radius: 12px; padding: 1rem 1.25rem; text-align: center;
        }
        .summary-num { font-size: 2rem; font-weight: 900; line-height: 1; }
        .summary-label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #a898cc; margin-top: 0.25rem; }

        /* FILTER BAR */
        .filter-bar {
          display: flex; flex-wrap: wrap; gap: 0.5rem;
          padding: 0 1.75rem 1.25rem;
        }
        .filter-btn {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(118,73,188,0.25);
          color: #c4b8e0; border-radius: 8px; padding: 0.35rem 0.85rem;
          font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .filter-btn:hover { border-color: var(--purple); color: #fff; }
        .filter-btn.active { background: var(--purple); border-color: var(--purple); color: #fff; }

        /* TABLE */
        .table-wrapper {
          overflow-x: auto; padding: 0 1.75rem 3rem;
        }
        .apps-table {
          width: 100%; border-collapse: collapse;
          font-size: 0.85rem; min-width: 900px;
        }
        .apps-table thead th {
          background: rgba(118,73,188,0.18); color: var(--gold);
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 0.65rem 0.85rem; text-align: left; border-bottom: 2px solid rgba(118,73,188,0.3);
          white-space: nowrap;
        }
        .apps-table tbody tr {
          border-bottom: 1px solid rgba(118,73,188,0.12);
          transition: background 0.15s;
        }
        .apps-table tbody tr:hover { background: rgba(118,73,188,0.07); }
        .apps-table tbody td {
          padding: 0.7rem 0.85rem; vertical-align: middle;
          color: #d4c8ee;
        }
        .td-name { font-weight: 700; color: #fff; white-space: nowrap; }
        .td-email { color: #a898cc; font-size: 0.8rem; }
        .td-whatsapp { color: #a898cc; font-size: 0.8rem; white-space: nowrap; }
        .td-town { white-space: nowrap; }
        .td-town-name { font-weight: 600; color: #fff; }
        .td-province { font-size: 0.75rem; color: #a898cc; }
        .td-truncate { max-width: 180px; color: #c4b8e0; font-size: 0.82rem; }
        .td-score {
          font-weight: 800; font-size: 1rem; text-align: center;
          color: var(--gold);
        }
        .td-score.null { color: #4a3d6b; }

        /* SKILL BADGE */
        .skill-badge {
          display: inline-block; font-size: 0.72rem; font-weight: 700;
          padding: 0.2rem 0.55rem; border-radius: 6px; white-space: nowrap;
          text-transform: capitalize;
        }

        /* STATUS */
        .status-cell { position: relative; }
        .status-pill {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.75rem; font-weight: 700; text-transform: capitalize;
          padding: 0.28rem 0.65rem; border-radius: 8px; cursor: pointer;
          border: 1px solid transparent; white-space: nowrap;
          transition: opacity 0.15s;
        }
        .status-pill:hover { opacity: 0.85; }
        .status-pill svg { width: 10px; height: 10px; }
        .status-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0; z-index: 30;
          background: #1a1030; border: 1px solid rgba(118,73,188,0.5);
          border-radius: 10px; overflow: hidden; min-width: 130px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .status-option {
          display: block; padding: 0.55rem 0.85rem; font-size: 0.8rem; font-weight: 600;
          color: #c4b8e0; cursor: pointer; text-transform: capitalize;
          transition: background 0.1s;
        }
        .status-option:hover { background: rgba(118,73,188,0.25); }
        .status-option.current { color: #fff; font-weight: 800; }

        /* VIEW BUTTON */
        .view-btn {
          background: rgba(118,73,188,0.2); border: 1px solid rgba(118,73,188,0.35);
          color: #c4b8e0; border-radius: 7px; padding: 0.3rem 0.65rem;
          font-size: 0.75rem; font-weight: 600; cursor: pointer; font-family: inherit;
          white-space: nowrap; transition: background 0.15s;
        }
        .view-btn:hover { background: rgba(118,73,188,0.4); color: #fff; }

        /* EMPTY */
        .empty-state {
          text-align: center; padding: 4rem 2rem; color: #4a3d6b;
          font-size: 0.95rem;
        }

        /* LOADING */
        .loading-state {
          text-align: center; padding: 4rem 2rem; color: var(--purple);
        }

        /* MODAL */
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(7,5,9,0.85);
          z-index: 100; display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
        }
        .modal-card {
          background: #0f0b1a; border: 1px solid rgba(118,73,188,0.4);
          border-radius: 20px; padding: 2rem; max-width: 620px; width: 100%;
          max-height: 85vh; overflow-y: auto; position: relative;
        }
        .modal-close {
          position: absolute; top: 1rem; right: 1rem;
          background: rgba(255,255,255,0.07); border: none; border-radius: 8px;
          color: #a898cc; width: 32px; height: 32px; cursor: pointer;
          font-size: 1rem; font-family: inherit; display: flex; align-items: center; justify-content: center;
        }
        .modal-close:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .modal-name { font-size: 1.3rem; font-weight: 800; color: #fff; margin-bottom: 0.25rem; }
        .modal-meta { color: #a898cc; font-size: 0.85rem; margin-bottom: 1.5rem; }
        .modal-section { margin-bottom: 1.25rem; }
        .modal-section-title {
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--gold); margin-bottom: 0.4rem;
        }
        .modal-section-body { color: #c4b8e0; font-size: 0.9rem; line-height: 1.6; }
        .modal-divider { border: none; border-top: 1px solid rgba(118,73,188,0.2); margin: 1.25rem 0; }
        .modal-row { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .modal-field { flex: 1; min-width: 160px; }
        .modal-field-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #7649bc; margin-bottom: 0.2rem; }
        .modal-field-val { font-size: 0.9rem; color: #e8e0f5; }
      `}),(0,d.jsxs)("div",{className:"admin-layout",children:[(0,d.jsxs)("div",{className:"topbar",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{className:"topbar-title",children:"Ubuntu Build Fellowship"}),(0,d.jsx)("div",{className:"topbar-sub",children:"Applications Dashboard"})]}),(0,d.jsx)("div",{className:"topbar-right",children:(0,d.jsx)("button",{className:"refresh-btn",onClick:x,disabled:n,children:n?"Loading…":"Refresh"})})]}),(0,d.jsxs)("div",{className:"summary-strip",children:[(0,d.jsxs)("div",{className:"summary-card",children:[(0,d.jsx)("div",{className:"summary-num",style:{color:"#fff"},children:z}),(0,d.jsx)("div",{className:"summary-label",children:"Total"})]}),(0,d.jsxs)("div",{className:"summary-card",children:[(0,d.jsx)("div",{className:"summary-num",style:{color:i.pending},children:A}),(0,d.jsx)("div",{className:"summary-label",children:"Pending"})]}),(0,d.jsxs)("div",{className:"summary-card",children:[(0,d.jsx)("div",{className:"summary-num",style:{color:i.reviewing},children:D}),(0,d.jsx)("div",{className:"summary-label",children:"Reviewing"})]}),(0,d.jsxs)("div",{className:"summary-card",children:[(0,d.jsx)("div",{className:"summary-num",style:{color:i.shortlisted},children:B}),(0,d.jsx)("div",{className:"summary-label",children:"Shortlisted"})]}),(0,d.jsxs)("div",{className:"summary-card",children:[(0,d.jsx)("div",{className:"summary-num",style:{color:i.accepted},children:C}),(0,d.jsx)("div",{className:"summary-label",children:"Accepted"})]}),(0,d.jsxs)("div",{className:"summary-card",children:[(0,d.jsx)("div",{className:"summary-num",style:{color:i.rejected},children:E}),(0,d.jsx)("div",{className:"summary-label",children:"Rejected"})]})]}),(0,d.jsx)("div",{className:"filter-bar",children:["All",...g].map(a=>(0,d.jsx)("button",{className:`filter-btn${p===a?" active":""}`,onClick:()=>q(a),children:a},a))}),(0,d.jsx)("div",{className:"table-wrapper",children:n?(0,d.jsx)("div",{className:"loading-state",children:"Loading applications…"}):0===F.length?(0,d.jsx)("div",{className:"empty-state",children:"All"===p?"No applications yet.":`No applications for ${p} yet.`}):(0,d.jsxs)("table",{className:"apps-table",children:[(0,d.jsx)("thead",{children:(0,d.jsxs)("tr",{children:[(0,d.jsx)("th",{children:"Name"}),(0,d.jsx)("th",{children:"Email"}),(0,d.jsx)("th",{children:"WhatsApp"}),(0,d.jsx)("th",{children:"Town"}),(0,d.jsx)("th",{children:"Connection"}),(0,d.jsx)("th",{children:"Challenge"}),(0,d.jsx)("th",{children:"Build Idea"}),(0,d.jsx)("th",{children:"Skill"}),(0,d.jsx)("th",{children:"Score"}),(0,d.jsx)("th",{children:"Status"}),(0,d.jsx)("th",{children:"View"})]})}),(0,d.jsx)("tbody",{children:F.map(a=>(0,d.jsxs)("tr",{children:[(0,d.jsx)("td",{className:"td-name",children:a.full_name}),(0,d.jsx)("td",{className:"td-email",children:(0,d.jsx)("a",{href:`mailto:${a.email}`,style:{color:"#a898cc",textDecoration:"none"},children:a.email})}),(0,d.jsx)("td",{className:"td-whatsapp",children:a.whatsapp??"—"}),(0,d.jsxs)("td",{className:"td-town",children:[(0,d.jsx)("div",{className:"td-town-name",children:a.location||a.town_slug}),(0,d.jsx)("div",{className:"td-province",children:a.province})]}),(0,d.jsx)("td",{className:"td-truncate",children:l(a.town_connection,60)}),(0,d.jsx)("td",{className:"td-truncate",children:l(a.town_challenge,80)}),(0,d.jsx)("td",{className:"td-truncate",children:l(a.build_idea,80)}),(0,d.jsx)("td",{children:(0,d.jsx)("span",{className:"skill-badge",style:{background:"advanced"===a.skill_level?"rgba(74,222,128,0.15)":"intermediate"===a.skill_level?"rgba(96,165,250,0.15)":"beginner"===a.skill_level?"rgba(238,184,73,0.15)":"rgba(148,163,184,0.15)",color:"advanced"===a.skill_level?"#4ade80":"intermediate"===a.skill_level?"#60a5fa":"beginner"===a.skill_level?"#eeb849":"#94a3b8"},children:a.skill_level})}),(0,d.jsx)("td",{className:`td-score${null==a.total_score?" null":""}`,children:null!=a.total_score?a.total_score:"—"}),(0,d.jsxs)("td",{className:"status-cell","data-status-dropdown":!0,children:[(0,d.jsxs)("div",{className:"status-pill",style:{background:j[a.status],color:i[a.status],border:`1px solid ${i[a.status]}40`},onClick:()=>u(t===a.id?null:a.id),role:"button",tabIndex:0,onKeyDown:b=>{("Enter"===b.key||" "===b.key)&&u(t===a.id?null:a.id)},"aria-haspopup":"listbox","aria-expanded":t===a.id,children:[r===a.id?"Saving…":a.status,(0,d.jsx)("svg",{viewBox:"0 0 10 6",fill:"none",stroke:"currentColor",strokeWidth:"1.5",children:(0,d.jsx)("path",{d:"M1 1l4 4 4-4"})})]}),t===a.id&&(0,d.jsx)("div",{className:"status-dropdown",role:"listbox",children:k.map(b=>(0,d.jsx)("div",{className:`status-option${a.status===b?" current":""}`,style:{color:i[b]},role:"option","aria-selected":a.status===b,onClick:()=>y(a.id,b),onKeyDown:c=>{"Enter"===c.key&&y(a.id,b)},tabIndex:0,children:b},b))})]}),(0,d.jsx)("td",{children:(0,d.jsx)("button",{className:"view-btn",onClick:()=>w(a),children:"View Full"})})]},a.id))})]})})]}),v&&(0,d.jsx)("div",{className:"modal-backdrop",onClick:a=>{a.target===a.currentTarget&&w(null)},role:"dialog","aria-modal":"true","aria-label":`Application details for ${v.full_name}`,children:(0,d.jsxs)("div",{className:"modal-card",children:[(0,d.jsx)("button",{className:"modal-close",onClick:()=>w(null),"aria-label":"Close",children:"✕"}),(0,d.jsx)("div",{className:"modal-name",children:v.full_name}),(0,d.jsxs)("div",{className:"modal-meta",children:[v.email,v.whatsapp?` \xb7 ${v.whatsapp}`:""," \xb7 ",new Date(v.created_at).toLocaleDateString("en-ZA",{dateStyle:"medium"})]}),(0,d.jsxs)("div",{className:"modal-row",children:[(0,d.jsxs)("div",{className:"modal-field",children:[(0,d.jsx)("div",{className:"modal-field-label",children:"Town"}),(0,d.jsx)("div",{className:"modal-field-val",children:v.location||v.town_slug})]}),(0,d.jsxs)("div",{className:"modal-field",children:[(0,d.jsx)("div",{className:"modal-field-label",children:"Province"}),(0,d.jsx)("div",{className:"modal-field-val",children:v.province})]}),(0,d.jsxs)("div",{className:"modal-field",children:[(0,d.jsx)("div",{className:"modal-field-label",children:"Skill Level"}),(0,d.jsx)("div",{className:"modal-field-val",style:{textTransform:"capitalize"},children:v.skill_level})]}),(0,d.jsxs)("div",{className:"modal-field",children:[(0,d.jsx)("div",{className:"modal-field-label",children:"Score"}),(0,d.jsx)("div",{className:"modal-field-val",style:{color:"#eeb849",fontWeight:800},children:null!=v.total_score?v.total_score:"—"})]})]}),(0,d.jsx)("hr",{className:"modal-divider"}),(0,d.jsxs)("div",{className:"modal-section",children:[(0,d.jsx)("div",{className:"modal-section-title",children:"Town Connection"}),(0,d.jsx)("div",{className:"modal-section-body",children:v.town_connection})]}),(0,d.jsxs)("div",{className:"modal-section",children:[(0,d.jsx)("div",{className:"modal-section-title",children:"Biggest Challenge Facing Their Town"}),(0,d.jsx)("div",{className:"modal-section-body",children:v.town_challenge})]}),(0,d.jsxs)("div",{className:"modal-section",children:[(0,d.jsx)("div",{className:"modal-section-title",children:"What They Want to Build"}),(0,d.jsx)("div",{className:"modal-section-body",children:v.build_idea})]}),(0,d.jsx)("hr",{className:"modal-divider"}),(0,d.jsxs)("div",{className:"modal-section",children:[(0,d.jsx)("div",{className:"modal-section-title",children:"Update Status"}),(0,d.jsx)("div",{style:{display:"flex",gap:"0.5rem",flexWrap:"wrap"},children:k.map(a=>(0,d.jsx)("button",{onClick:()=>{y(v.id,a),w(b=>b?{...b,status:a}:null)},style:{background:v.status===a?j[a]:"rgba(255,255,255,0.04)",border:`1px solid ${v.status===a?i[a]+"80":"rgba(118,73,188,0.2)"}`,color:v.status===a?i[a]:"#a898cc",borderRadius:"8px",padding:"0.35rem 0.85rem",fontSize:"0.8rem",fontWeight:700,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize",transition:"all 0.15s"},children:a},a))})]})]})})]})}},55511:a=>{"use strict";a.exports=require("crypto")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},74075:a=>{"use strict";a.exports=require("zlib")},77247:(a,b,c)=>{Promise.resolve().then(c.bind(c,53037))},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},95399:(a,b,c)=>{Promise.resolve().then(c.bind(c,49567))}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[857,5663,4797,3941,2950,9283],()=>b(b.s=3055));module.exports=c})();