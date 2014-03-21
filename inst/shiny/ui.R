library(shiny)
library(LDAvis)
#anytime a file under the assets folder is changed, LDAvis must be reinstalled (to reflect the change)!
addResourcePath('assets', system.file('shiny', 'assets', package='LDAvis'))

topic.choices <- paste(0L:length(topic.proportion))
names(topic.choices) <-  c("None Selected", topic.choices[-1])

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
    tags$script(src = "assets/d3.v3.js"),
    tags$script(src ="assets/topicz.js"),
    tags$link(rel = 'stylesheet', type = 'text/css', href = 'assets/topicz.css')
  ),

  wellPanel(
    div(style = widget_style, sliderInput("kmeans", "Number of clusters", min=1, max=10, value=1)),
    div(style = widget_style,
        sliderInput("nTerms", "Number of terms", min=1, max=50, value=30)
    ), 
    div(style = widget_style,
        sliderInput("lambda", "Value of lambda", min=0, max=1, value=0.6)
    ),
    div(style = widget_style,
        selectInput("distance", "Distance Calculation", choices = c("Jensen-Shannon" = "JS", 
                                                                    "Symmetric Kullback-Leibler" = "KL"))
    ),
    div(style = widget_style,
        selectInput("scaling", "Multidimensional Scaling Method", choices = c("Classical (PCA)" = "PCA", 
                                                                    "Kruskal's Non-Metric" = "kruskal",
                                                                    "Sammon's Non-Linear Mapping" = "sammon"))
    ),
    div(style = widget_style,
        selectInput("currentTopic", "Select a Topic", choices = topic.choices)
    )
  ),

  mainPanel(#the el parameter in the js code selects the outputIds
             HTML(paste0("<div id=\"mdsDat\" class=\"shiny-scatter-output\"><svg /></div>"))
  )
))
