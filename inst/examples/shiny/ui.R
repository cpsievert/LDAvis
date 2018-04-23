library(LDAvis)
shinyUI(
  fluidPage(
    sliderInput("nTerms", "Number of terms to display", min = 20, max = 40, value = 30),
    textOutput("termClicked"),
    textOutput("topicClicked"),
    visOutput('myChart')
  )
)