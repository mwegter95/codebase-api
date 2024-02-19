FROM alpine:latest
WORKDIR /app
ENTRYPOINT ["/bin/sh"]

# Use the script-runner image as base
FROM script-runner:latest

# Install Git using Alpine package manager (apk)
RUN apk update && \
    apk add --no-cache git

# Set custom Git configuration in the container
RUN printf "[includeIf \"gitdir:personal/\"]\n\tpath = .gitconfig-personal\n\n\
    [includeIf \"gitdir:company/\"]\n\tpath = .gitconfig-company\n\n\
    [user]\n\tname = mwegter95\n\temail = mwegter95@gmail.com\n\
    [status]\n\tsubmoduleSummary = true\n\
    [diff]\n\tsubmodule = log\n\
    [init]\n\tdefaultBranch = main\n\
    [pull]\n\trebase = false\n" > /root/.gitconfig

