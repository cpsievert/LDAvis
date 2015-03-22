library(LDAvis)
library(shiny)
shinyServer(function(input, output, session) {
  output$myChart <- renderVis({
    with(TwentyNewsgroups,
         createJSON(phi, theta, doc.length, vocab, term.frequency,
                    R = input$nTerms))})
})