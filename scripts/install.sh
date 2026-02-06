#!/bin/sh
set -e

REPO="trust-ethos/ethos-cli"
INSTALL_DIR="$HOME/.ethos"
BIN_DIR="$INSTALL_DIR/bin"

info() {
  printf "\033[0;34m%s\033[0m\n" "$1"
}

success() {
  printf "\033[0;32m%s\033[0m\n" "$1"
}

error() {
  printf "\033[0;31mError: %s\033[0m\n" "$1" >&2
  exit 1
}

detect_platform() {
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)

  case "$OS" in
    darwin) OS="darwin" ;;
    linux) OS="linux" ;;
    mingw*|msys*|cygwin*) OS="win32" ;;
    *) error "Unsupported operating system: $OS" ;;
  esac

  case "$ARCH" in
    x86_64|amd64) ARCH="x64" ;;
    arm64|aarch64) ARCH="arm64" ;;
    *) error "Unsupported architecture: $ARCH" ;;
  esac

  PLATFORM="${OS}-${ARCH}"
}

get_latest_version() {
  if command -v curl >/dev/null 2>&1; then
    VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
  elif command -v wget >/dev/null 2>&1; then
    VERSION=$(wget -qO- "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
  else
    error "curl or wget is required"
  fi

  if [ -z "$VERSION" ]; then
    error "Could not determine latest version"
  fi
}

download_and_install() {
  VERSION_DIR="$INSTALL_DIR/versions/$VERSION"
  TARBALL="/tmp/ethos-$VERSION.tar.gz"

  info "Downloading ethos $VERSION for $PLATFORM..."
  
  # Find the actual asset name (oclif includes commit hash in filename)
  if command -v curl >/dev/null 2>&1; then
    ASSET_NAME=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/tags/$VERSION" | grep -o "\"name\": \"ethos-$VERSION-[^\"]*-$PLATFORM.tar.gz\"" | head -1 | sed 's/"name": "\(.*\)"/\1/')
  else
    ASSET_NAME=$(wget -qO- "https://api.github.com/repos/$REPO/releases/tags/$VERSION" | grep -o "\"name\": \"ethos-$VERSION-[^\"]*-$PLATFORM.tar.gz\"" | head -1 | sed 's/"name": "\(.*\)"/\1/')
  fi

  if [ -z "$ASSET_NAME" ]; then
    error "Could not find release asset for $PLATFORM"
  fi

  DOWNLOAD_URL="https://github.com/$REPO/releases/download/$VERSION/$ASSET_NAME"
  
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$DOWNLOAD_URL" -o "$TARBALL" || error "Download failed. Check if release exists for $PLATFORM"
  else
    wget -q "$DOWNLOAD_URL" -O "$TARBALL" || error "Download failed. Check if release exists for $PLATFORM"
  fi

  info "Installing to $INSTALL_DIR..."
  
  mkdir -p "$VERSION_DIR"
  tar -xzf "$TARBALL" -C "$VERSION_DIR" --strip-components=1
  rm -f "$TARBALL"

  rm -f "$INSTALL_DIR/current"
  ln -sf "$VERSION_DIR" "$INSTALL_DIR/current"

  # Create a dedicated bin directory with ONLY the ethos symlink.
  # This prevents the bundled node binary (included by oclif pack)
  # from overriding users' system node / nvm / fnm / volta installations.
  mkdir -p "$BIN_DIR"
  rm -f "$BIN_DIR/ethos"
  ln -sf "$INSTALL_DIR/current/bin/ethos" "$BIN_DIR/ethos"
}

setup_path() {
  SHELL_NAME=$(basename "$SHELL")
  OLD_BIN_DIR="$INSTALL_DIR/current/bin"
  
  case "$SHELL_NAME" in
    bash)
      PROFILE="$HOME/.bashrc"
      [ -f "$HOME/.bash_profile" ] && PROFILE="$HOME/.bash_profile"
      ;;
    zsh)
      PROFILE="$HOME/.zshrc"
      ;;
    fish)
      PROFILE="$HOME/.config/fish/config.fish"
      ;;
    *)
      PROFILE="$HOME/.profile"
      ;;
  esac

  PATH_LINE="export PATH=\"$BIN_DIR:\$PATH\""
  
  if [ "$SHELL_NAME" = "fish" ]; then
    PATH_LINE="set -gx PATH $BIN_DIR \$PATH"
  fi

  # Remove old PATH entry that exposed bundled node binary
  if grep -q "$OLD_BIN_DIR" "$PROFILE" 2>/dev/null; then
    sed -i.bak "/$( echo "$OLD_BIN_DIR" | sed 's/[\/&]/\\&/g' )/d" "$PROFILE"
    rm -f "${PROFILE}.bak"
    info "Removed old PATH entry ($OLD_BIN_DIR) from $PROFILE"
  fi

  if ! grep -q "$BIN_DIR" "$PROFILE" 2>/dev/null; then
    echo "" >> "$PROFILE"
    echo "# Ethos CLI" >> "$PROFILE"
    echo "$PATH_LINE" >> "$PROFILE"
    info "Added $BIN_DIR to PATH in $PROFILE"
  fi
}

main() {
  info "Installing Ethos CLI..."
  
  detect_platform
  get_latest_version
  download_and_install
  setup_path

  success ""
  success "Ethos CLI $VERSION installed successfully!"
  success ""
  success "To get started, restart your terminal or run:"
  success "  export PATH=\"$BIN_DIR:\$PATH\""
  success ""
  success "Then try:"
  success "  ethos --help"
}

main
