FROM ubuntu:22.04
RUN apt-get update && DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y \
    wget curl xz-utils ca-certificates python3 git build-essential cmake tclsh zip zstd gettext
# Node 24 (exigido pelo install_emsdk.sh), tarball oficial
RUN ARCH=$(uname -m | sed 's/aarch64/arm64/;s/x86_64/x64/') && \
    curl -fsSL https://nodejs.org/dist/v24.22.3/node-v24.22.3-linux-$ARCH.tar.xz | tar -xJ -C /opt && \
    ln -s /opt/node-v24.22.3-linux-$ARCH/bin/node /usr/local/bin/node && \
    ln -s /opt/node-v24.22.3-linux-$ARCH/bin/npm /usr/local/bin/npm && node --version
COPY . /luanti-wasm
WORKDIR /luanti-wasm
RUN ./install_emsdk.sh
RUN ./build_all.sh
