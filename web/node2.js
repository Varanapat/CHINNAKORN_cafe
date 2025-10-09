javascript:(async function(){
  function walkTextNodes(root){
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const arr = [];
    while(walker.nextNode()) arr.push(walker.currentNode);
    return arr;
  }
  const nodes = walkTextNodes(document.body).slice(0,200);
  const texts = nodes.map(n=>n.nodeValue);
  try{
    const resp = await fetch('https://libretranslate.de/translate', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({q:texts,source:'auto',target:'th',format:'text'})
    });
    const data = await resp.json();
    const translations = Array.isArray(data) ? data.map(x=>x.translatedText??x) : [data.translatedText||data];
    nodes.forEach((n,i)=>{ n.nodeValue = translations[i] || n.nodeValue; });
    alert('Translated ' + nodes.length + ' text nodes (limited).');
  }catch(e){alert('Error: '+e.message)}
})();
