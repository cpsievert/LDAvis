#' Associated Press News Articles
#'
#' @format A list elements extracted from a topic model fit to this data
#' \describe{
#'   \item{phi}{phi, a matrix with the topic-term distributions}
#'   \item{theta}{theta, a matrix with the document-topic distributions}
#'   \item{doc.length}{doc.length, a numeric vector with token counts for each document}
#'   \item{vocab}{vocab, a character vector containing the terms}
#'   \item{term.frequency}{term.frequency, a numeric vector of observed term frequencies}
#' }
#' @source \url{http://www.cs.princeton.edu/~blei/lda-c/index.html}
"AP"

#' Twenty Newsgroups Data
#'
#' @format A list elements extracted from a topic model fit to this data
#' \describe{
#'   \item{phi}{phi, a matrix with the topic-term distributions}
#'   \item{theta}{theta, a matrix with the document-topic distributions}
#'   \item{doc.length}{doc.length, a numeric vector with token counts for each document}
#'   \item{vocab}{vocab, a character vector containing the terms}
#'   \item{term.frequency}{term.frequency, a numeric vector of observed term frequencies}
#' }
#' @source \url{http://qwone.com/~jason/20Newsgroups/}
"TwentyNewsgroups"

#' Daily weblog with political analysis on US current events from a liberal perspective.
#'
#' @format A list elements extracted from a topic model fit to this data
#' \describe{
#'   \item{phi}{phi, a matrix with the topic-term distributions}
#'   \item{theta}{theta, a matrix with the document-topic distributions}
#'   \item{doc.length}{doc.length, a numeric vector with token counts for each document}
#'   \item{vocab}{vocab, a character vector containing the terms}
#'   \item{term.frequency}{term.frequency, a numeric vector of observed term frequencies}
#' }
#' @source \url{https://archive.ics.uci.edu/ml/datasets/Bag+of+Words}
"DailyKos"

#' Jeopardy Questions (including category name and answer)
#'
#' @format A list elements extracted from a topic model fit to this data
#' \describe{
#'   \item{phi}{phi, a matrix with the topic-term distributions}
#'   \item{theta}{theta, a matrix with the document-topic distributions}
#'   \item{doc.length}{doc.length, a numeric vector with token counts for each document}
#'   \item{vocab}{vocab, a character vector containing the terms}
#'   \item{term.frequency}{term.frequency, a numeric vector of observed term frequencies}
#' }
#' @source \url{http://www.reddit.com/r/datasets/comments/1uyd0t/200000_jeopardy_questions_in_a_json_file}
"Jeopardy"
