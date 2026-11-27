/* Ponte Lovable: substitui window.claude (só existe no Claude) pela IA do Lovable via app pai.
   Mantém a mesma interface usada pelo app.js: claude.use("sample") e claude.use("downloads"). */
(function () {
  "use strict";
  function host() { try { return window.parent && window.parent.__psxBridge; } catch (e) { return null; } }
  function toDataURL(b) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(b); });
  }
  async function call(body) {
    var h = host(); if (!h) throw { code: "not_granted" };
    return h.ask(body);
  }
  var sample = async function (messages, opts) {
    var r = await call({ mode: "text", messages: messages });
    var text = (r && r.text) || "";
    if (opts && typeof opts.onText === "function") { try { opts.onText({ text: text }); } catch (e) {} }
    return { text: text };
  };
  sample.json = async function (prompt, opts) {
    var images = [];
    if (opts && opts.images && opts.images.length) {
      for (var i = 0; i < opts.images.length; i++) images.push(await toDataURL(opts.images[i]));
    }
    var r = await call({ mode: "json", prompt: prompt, images: images });
    return r && r.json;
  };
  sample.limits = async function () { return { images: { maxCount: 3 } }; };
  var downloads = {
    save: async function (o) {
      var url = URL.createObjectURL(o.data), a = document.createElement("a");
      a.href = url; a.download = o.filename || "documento.pdf"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    },
  };
  window.claude = { use: function (k) { return Promise.resolve(k === "sample" ? sample : k === "downloads" ? downloads : null); } };
})();
