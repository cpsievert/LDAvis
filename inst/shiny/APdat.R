#new example data for ldatools
library(topicmodels)
data("AssociatedPress")
docs <- AssociatedPress$i
words <- AssociatedPress$j
doc.id <- rep(docs, AssociatedPress$v)
word.id <- rep(words, AssociatedPress$v)
vocab <- AssociatedPress$dimnames$Terms
tokens <- vocab[word.id]
max(word.id) - summary(word.id)[6] #why is this not zero????????

library(ldatools)
APtopics <- fitLDA(word.id, doc.id, k = 30)
plotLoglik(APtopics$loglik)
plotLoglik(APtopics$loglik, zoom=TRUE)
#if converged, save it
#save(APtopics, file="~/LDAtool/data/APtopics.rda")
#if not converged, start where we left off....
APtopics <- fitLDA(word.id, doc.id, k = 30, topics.init=APtopics$topics)
plotLoglik(APtopics$loglik)
plotLoglik(APtopics$loglik, zoom=TRUE)
save(APtopics, file="~/LDAtool/data/APtopics.rda")
shinydat <- data.frame(tokens=tokens, topics=APtopics$topics, docs=doc.id)
write.table(shinydat, file="~/LDAtool/inst/shiny/hover/ap30.txt", sep="\t", row.names=FALSE)

#derive documents from ap datadet downloaded from http://www.cs.princeton.edu/~blei/lda-c/
setwd("~/Downloads/ap")
txt <- scan('ap.txt', sep="\n", what="character")
idx1 <- substr(txt, 0, 1) == "<"
idx2 <- substr(txt, 0, 2) == " <"
APcorpus <- txt[!idx1 & !idx2]
setwd("~/LDAtool/data/")
save(APcorpus, file="APcorpus.rda")
o <- order(nchar(APcorpus))
#4th and 5th document are actually included, but the 6th is excluded
exclude <- o[c(1:3,6)]
category <- numeric(length(APcorpus))
category[exclude] <- 1
APinput <- list(word.id=word.id, doc.id=doc.id, vocab=vocab, category=category)
save(APinput, file="APinput.rda")
write.table(APcorpus[category == 0], file="~/LDAtool/inst/shiny/hover/corpus.txt", col.names=FALSE, row.names=FALSE)
corpus <- read.table(file="~/LDAtool/inst/shiny/hover/corpus.txt", stringsAsFactors=FALSE)[,1]
#sanity check
all(test == corpus)

data(APinput)
data(APtopics)
data(APcorpus)

dat <- getProbs(APinput$word.id, APinput$doc.id, APtopics$topic, APinput$vocab)
top.docs <- topdocs(dat$theta.hat, APcorpus[APinput$category == 0], n=5)
write.table(top.docs, file="~/LDAtool/inst/shiny/hover/top5docs.txt", col.names=FALSE, row.names=FALSE)
save(top.docs, file="~/LDAtool/data/APtopdocs.rda")

phi <- data.frame(t(dat$phi.hat))
write.table(phi, file="~/Desktop/github/local/LDAvis/phi.txt", sep="\t")

