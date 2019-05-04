export default function(context) {
  console.log("check auth");

  context.store.dispatch("initAuth", context.req);
}
