#' Shiny ui output function
#' @param outputId output variable to read the plot from
#' @seealso http://shiny.rstudio.com/articles/building-outputs.html
#' @export
#' 
visOutput <- function(outputId) {
  # Note that requireNamespace("shiny") should load digest & htmltools (both used later on)
  if (!requireNamespace("shiny")) message("Please install.packages('shiny')")
  deps <- lapply(ldavis_dependencies(), shiny::createWebDependency)
  htmltools::attachDependencies(
    htmltools::tags$div(id = outputId, class = 'shinyLDAvis'), 
    deps
  )
}

#' Create an LDAvis output element
#' 
#' Shiny server output function customized for animint plots 
#' (similar to \code{shiny::plotOutput} and friends).
#' 
#' @param expr An expression that generates a plot.
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is expr a quoted expression (with \code{quote()})? This is useful if you want to save an expression in a variable.
#' @seealso http://shiny.rstudio.com/articles/building-outputs.html
#' @export
#' 
renderVis <- function(expr, env = parent.frame(), quoted = FALSE) {
  # Note that requireNamespace("shiny") should load digest & htmltools (both used later on)
  if (!requireNamespace("shiny")) message("Please install.packages('shiny')")
  
  # Convert the expression + environment into a function
  func <- shiny::exprToFunction(expr, env, quoted)
  
  # this will tell knitr how to place animint into an interactive document
  # implementation is similar to htmlwidgets::shinyRenderWidget
  # we can't use that in our case since we must call animint2dir
  # everytime shiny calls renderFunc
  renderFunc <- function(shinysession, name, ...) {
    # func() should return a string that contains a JSON object
    val <- func()
    #  digest will guarantee a unique json file name for each output
    jsonFile <- paste0(digest::digest(val), '.json')
    tmp <- tempdir()
    cat(val, file = file.path(tmp, jsonFile))
    shiny::addResourcePath("ldavisAssets", tmp)
    list(jsonFile = jsonFile)
  }
  shiny::markRenderFunction(LDAvis::visOutput, renderFunc)
}

# html dependencies according htmltools protocols
# these are here basically so we can take advantage of shiny::createWebDependency
ldavis_dependencies <- function() {
  list(html_dependency_d3(),
       html_dependency_ldavis(),
       html_dependency_ldavis_css(),
       html_dependency_ldavis_shiny())
}

html_dependency_d3 <- function() {
  htmltools::htmlDependency(name = "d3",
                            version = "3.2.7",
                            src = system.file("htmljs", package = "LDAvis"),
                            script = "d3.v3.js")
}

html_dependency_ldavis <- function() {
  htmltools::htmlDependency(name = "ldavis",
                            version = utils::packageVersion("LDAvis"),
                            src = system.file("htmljs", package = "LDAvis"),
                            script = "ldavis.js")
}

html_dependency_ldavis_css <- function() {
  htmltools::htmlDependency(name = "ldavis-css",
                            version = utils::packageVersion("LDAvis"),
                            src = system.file("htmljs", package = "LDAvis"),
                            stylesheet = "lda.css")
}

html_dependency_ldavis_shiny <- function() {
  htmltools::htmlDependency(name = "shinyLDAvis",
                            version = utils::packageVersion("LDAvis"),
                            src = system.file("shiny", package = "LDAvis"),
                            script = "shinyLDAvis.js")
}

