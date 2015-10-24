var ldavisBinding = new Shiny.OutputBinding();

ldavisBinding.find = function(scope) {
  return $(scope).find(".shinyLDAvis");
};

ldavisBinding.renderValue = function(el, data) {
  // remove the old graph 
  // http://stackoverflow.com/questions/14422198/how-do-i-remove-all-children-elements-from-a-node-and-them-apply-them-again-with
  var old_plot = d3.select(el).selectAll("*").remove();
  // add the new plot
  var json_file = "ldavisAssets/" + data.jsonFile;
  var to_select = "#" + el.id;
  var vis = new LDAvis(to_select, json_file);
  
};

Shiny.outputBindings.register(ldavisBinding, "cpsievert.ldavisBinding");
