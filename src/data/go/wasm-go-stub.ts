/**
 * @file The `go` global's `fs` / `process` syscall stub table for the Go WASM
 *   ABI shim (`wasm-executor.ts`). Split out to keep the executor under the
 *   file-size cap — every stub here is stateless (no executor instance state),
 *   so the factory takes no arguments.
 */

import { enosys } from './wasm-types'

import type { GoCallback } from './wasm-types'

export function createGoGlobalStub(): unknown {
  return {
    fs: {
      constants: {
        O_WRONLY: -1,
        O_RDWR: -1,
        O_CREAT: -1,
        O_TRUNC: -1,
        O_APPEND: -1,
        O_EXCL: -1,
      }, // unused
      write(
        _fd: number,
        _buf: BufferSource,
        _offset: number,
        _length: number,
        _position: number,
        callback: GoCallback,
      ) {
        callback(enosys())
      },
      chmod(_path: string, _mode: number, callback: GoCallback) {
        callback(enosys())
      },
      chown(_path: string, _uid: number, _gid: number, callback: GoCallback) {
        callback(enosys())
      },
      close(_fd: number, callback: GoCallback) {
        callback(enosys())
      },
      fchmod(_fd: number, _mode: number, callback: GoCallback) {
        callback(enosys())
      },
      fchown(_fd: number, _uid: number, _gid: number, callback: GoCallback) {
        callback(enosys())
      },
      fstat(_fd: number, callback: GoCallback) {
        callback(enosys())
      },
      fsync(_fd: number, callback: GoCallback<void>) {
        // oxlint-disable-next-line socket/prefer-undefined-over-null -- GoCallback uses Node-style `(err, result)` signature; null signals "no error".
        callback(null, undefined)
      },
      ftruncate(_fd: number, _length: number, callback: GoCallback) {
        callback(enosys())
      },
      lchown(_path: string, _uid: number, _gid: number, callback: GoCallback) {
        callback(enosys())
      },
      link(_path: string, _link: string, callback: GoCallback) {
        callback(enosys())
      },
      lstat(_path: string, callback: GoCallback) {
        callback(enosys())
      },
      mkdir(_path: string, _perm: number, callback: GoCallback) {
        callback(enosys())
      },
      open(_path: string, _flags: number, _mode: number, callback: GoCallback) {
        callback(enosys())
      },
      read(
        _fd: number,
        _buf: ArrayBuffer | ArrayBufferView,
        _offset: number,
        _length: number,
        _position: number,
        callback: GoCallback,
      ) {
        callback(enosys())
      },
      readdir(_path: string, callback: GoCallback) {
        callback(enosys())
      },
      readlink(_path: string, callback: GoCallback) {
        callback(enosys())
      },
      rename(_from: string, _to: string, callback: GoCallback) {
        callback(enosys())
      },
      rmdir(_path: string, callback: GoCallback) {
        callback(enosys())
      },
      stat(_path: string, callback: GoCallback) {
        callback(enosys())
      },
      symlink(_path: string, _link: string, callback: GoCallback) {
        callback(enosys())
      },
      truncate(_path: string, _length: number, callback: GoCallback) {
        callback(enosys())
      },
      unlink(_path: string, callback: GoCallback) {
        callback(enosys())
      },
      utimes(
        _path: string,
        _atime: number,
        _mtime: number,
        callback: GoCallback,
      ) {
        callback(enosys())
      },
    },
    process: {
      getuid() {
        return -1
      },
      getgid() {
        return -1
      },
      geteuid() {
        return -1
      },
      getegid() {
        return -1
      },
      getgroups() {
        throw enosys()
      },
      pid: -1,
      ppid: -1,
      umask() {
        throw enosys()
      },
      cwd() {
        throw enosys()
      },
      chdir() {
        throw enosys()
      },
    },
  }
}
