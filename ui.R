library(shiny)
library(LDAviz)
#anytime a file under the assets folder is changed, LDAviz must be reinstalled (to reflect the change)!
addResourcePath('assets', system.file('shiny', 'hover', 'assets', package='LDAviz'))

#nice idea, but it doesn't adapt to uploaded data
# data(input)
# vocab <- input$vocab #this is a lot words and slows loading time required to build the selectInputs (so we use top 450 terms instead)
# tokens <- input$vocab[input$word.id]
# tab <- table(tokens)
# pw <- tab/sum(tab)
# top <- names(tab)[order(tab, decreasing=FALSE) > 450] 

# Thanks Jeff! https://github.com/trestletech/shiny-sandbox/blob/master/grn/ui.R
scatterDiv <- function (outputId) {
  HTML(paste0("<div id=\"", outputId, "\" class=\"shiny-scatter-output\"><svg /></div>"))
}

# Thanks Winston! https://github.com/wch/testapp/blob/master/custom-style/ui.R
widget_style <-
  "display: inline-block;
  vertical-align: text-top;
  padding: 7px;
  border: solid;
  border-width: 1px;
  border-radius: 4px;
  border-color: #CCC;"

side_margins <-
  "margin-right:50px;
    margin-left:50px;"

#ugly hack to line up the documents below the scatterplot
top_margin <- 
  "margin-top:-550px;"

shinyUI(bootstrapPage(
  
  tags$head(
    #tags$script(src ="assets/select2.js"),
    #tags$script(src ="assets/myselect2.js"),
    #tags$link(rel = 'stylesheet', type = 'text/css', href = 'assets/select2.css'),
    tags$script(src = "https://c328740.ssl.cf1.rackcdn.com/mathjax/2.0-latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"),
    tags$script(src = "assets/d3.v3.js"),
    tags$script(src ="assets/topicz.js"),
    tags$link(rel = 'stylesheet', type = 'text/css', href = 'assets/topicz.css')
  ),

  wellPanel(
    div(style = widget_style, sliderInput("kmeans", "Number of clusters", min=1, max=10, value=1)),
    div(style = widget_style,
        sliderInput("nTerms", "Number of terms", min=1, max=50, value=35)
    ), 
    div(style = widget_style,
        sliderInput("lambda", "Value of lambda", min=0, max=1, value=1/3)
    ), 
#     #kinda slow - restrict to top 450 words!
#     div(style = widget_style,
#         selectInput(inputId = "tool2", label = "Remove a word:", choices = c("-", top), selected = 'Data view')
#     ),
    br(),
    br(),
    checkboxInput("newDat", "Upload data?", value=FALSE),
    conditionalPanel(
      condition = "input.newDat == true",
      fileInput("file1", "Choose file:"),
      helpText(HTML("This (required) tab-delimited text file should contain a header with variables named 'docs', 'topics' and 'tokens'."))
    ),
    conditionalPanel(
      condition = "input.newDat == true",
      fileInput("file2", "Choose file:"),
      helpText(HTML("Optionally upload documents. This tab-delimited text file should have a column for each topic (named 'TopicX') containing the most representative documents.
                    See the topdocs function in the ldatools package for an automated way to produce such a data structure."))
    )
  ),

  tabsetPanel(
    tabPanel("Overview", 
             scatterDiv(outputId = "mdsDat"), #the el parameter in the js code selects the outputIds
             div(style=paste(side_margins, top_margin, sep="\n   "), class='doc-list')
             ), 
    tabPanel("Dat", verbatimTextOutput(outputId = "dat")),
    tabPanel("What's This?", div(style = side_margins, includeMarkdown("assets/index.md")))
  )
))
