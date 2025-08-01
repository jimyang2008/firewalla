MIN_FREE_MEMORY=280
SAFE_MIN_FREE_MEMORY=360
REBOOT_FREE_MEMORY=160
FIREMAIN_MAX_MEMORY=684000
FIREMON_MAX_MEMORY=480000
FIREAPI_MAX_MEMORY=400000
MAX_NUM_OF_PROCESSES=6000
MAX_NUM_OF_THREADS=40000
CRONTAB_FILE=${FIREWALLA_HOME}/etc/crontab.gold
REAL_PLATFORM='real.gse'
MANAGED_BY_FIREBOOT=yes
FW_PROBABILITY="0.999"
FW_QOS_PROBABILITY="0.999"
ALOG_SUPPORTED=yes
FW_SCHEDULE_BRO=false
STATUS_LED_PATH='/sys/class/leds/sys_led/'
IFB_SUPPORTED=yes
XT_TLS_SUPPORTED=yes
MANAGED_BY_FIREROUTER=yes
REDIS_MAXMEMORY=400mb
RAMFS_ROOT_PARTITION=yes
FW_ZEEK_RSS_THRESHOLD=800000
MAX_OLD_SPACE_SIZE=512
HAVE_FWAPC=yes
HAVE_FWDAP=yes
WAN_INPUT_DROP_RATE_LIMIT=8

function get_openssl_cnf_file {
  echo '/etc/openvpn/easy-rsa/openssl.cnf'
}

function get_node_modules_url {
  echo "https://github.com/firewalla/fnm.node12.aarch64"
}

CURRENT_DIR=$(dirname $BASH_SOURCE)
FIRESTATUS_CONFIG=${CURRENT_DIR}/files/firestatus.yml
FIRESTATUS_BIN=${CURRENT_DIR}/files/firestatus
NEED_FIRESTATUS=true
OVERLAY_RESET_ON_BOOT=true
CGROUP_SOCK_MARK=${CURRENT_DIR}/files/cgroup_sock_mark

function get_brofish_service {
  echo "${CURRENT_DIR}/files/brofish.service"
}

function get_openvpn_service {
  echo "${CURRENT_DIR}/files/openvpn@.service"
}

function get_suricata_service {
  echo "${CURRENT_DIR}/files/suricata.service"
}

function get_sysctl_conf_path {
  echo "${CURRENT_DIR}/files/sysctl.conf"
}

function get_dynamic_assets_list {
  echo "${CURRENT_DIR}/files/assets.lst"
}

function get_node_bin_path {
  echo "/home/pi/.nvm/versions/node/v12.18.3/bin/node"
}

function get_zeek_log_dir {
  echo "/log/blog/"
}

function get_profile_default_name {
  driver=$(basename $(readlink -f /sys/class/net/eth0/device/driver))
  if [[ $driver == "r8125" ]]; then
    speed0=$(cat /sys/class/net/eth0/speed)
    speed3=$(cat /sys/class/net/eth3/speed)
    if (($speed0 < 1000)); then
      speed0=1000
    fi
    if (($speed3 < 1000)); then
      speed3=1000
    fi
    echo "profile_r8125_${speed0}_${speed3}"
  else
    speed0=$(cat /sys/class/net/eth0/speed)
    speed3=$(cat /sys/class/net/eth3/speed)
    if [[ $speed0 == "1000" || $speed3 == "1000" ]]; then
      echo "profile_1000"
    else
      echo "profile_default"
    fi
  fi
}

function map_target_branch {
  case "$1" in
  "release_6_0")
    echo "release_11_0"
    ;;
  "beta_6_0")
    echo "beta_16_0"
    ;;
  "beta_7_0")
    echo "beta_17_0"
    ;;
  *)
    echo $1
    ;;
  esac
}

function hook_server_route_up {
  # adjust rps_cpus for better performance
  sudo bash -c "echo 7 > /sys/class/net/tun_fwvpn/queues/rx-0/rps_cpus"
}

function hook_after_vpn_confgen {
  OVPN_CFG="$1"
  fgrep -q fast-io $OVPN_CFG || {

    sudo bash -c "cat >> $OVPN_CFG" <<EOS
fast-io
sndbuf 0
rcvbuf 0
EOS
  }

}

function get_tls_ko_path() {
  module_name=$1
  if [[ -z $module_name ]]; then
    echo "Module name is required"
    return 1
  fi
  EMMC_DEV=$(df /media/root-ro | grep -o '/dev/mmcblk[0-9]*')
  kernel_checksum=$(sudo dd if=$EMMC_DEV bs=512 count=75536 skip=73728 status=none | md5sum | awk '{print $1}')
  ko_path=${CURRENT_DIR}/files/kernel_modules/$(uname -r)/${module_name}.ko
  if [[ -f ${ko_path}.${kernel_checksum} ]]; then
    ko_path=${ko_path}.${kernel_checksum}
  fi
  echo $ko_path
}