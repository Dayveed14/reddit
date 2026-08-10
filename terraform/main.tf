terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Uncomment the section below to configure an S3 backend for shared state in production
  # backend "s3" {
  #   bucket         = "YOUR_TERRAFORM_STATE_BUCKET_NAME"
  #   key            = "api-deploy/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region to deploy resources"
}

variable "ssh_public_key" {
  type        = string
  description = "The SSH public key to associate with the EC2 instance"
}

# Use the Default VPC
resource "aws_default_vpc" "default" {}

# Use the Default Subnet in the region's first availability zone
resource "aws_default_subnet" "default_az1" {
  availability_zone = "${var.aws_region}a"
}

# Security Group for the Node.js API server
resource "aws_security_group" "api_sg" {
  name        = "node-api-security-group"
  description = "Allow SSH and Node.js API traffic"
  vpc_id      = aws_default_vpc.default.id

  # SSH Access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow SSH access from anywhere"
  }

  # Node API Access
  ingress {
    from_port   = 7000
    to_port     = 7000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow Node.js API port access from anywhere"
  }

  # Outbound Rules
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "node-api-sg"
  }
}

# SSH Key Pair
resource "aws_key_pair" "deployer_key" {
  key_name   = "reddit-key"
  public_key = var.ssh_public_key
}

# Query the latest Ubuntu 24.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical owner ID for Ubuntu AMIs
}

# EC2 Instance for deploying the API
resource "aws_instance" "api_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro"
  key_name               = aws_key_pair.deployer_key.key_name
  subnet_id              = aws_default_subnet.default_az1.id
  vpc_security_group_ids = [aws_security_group.api_sg.id]

  # Allocate public IP automatically
  associate_public_ip_address = true

  user_data = <<-EOF
              #!/bin/bash
              sudo apt-get update -y
              
              # Set up Node.js 22 (LTS) repository and install Node.js and packages
              curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
              sudo apt-get install -y nodejs git rsync
              
              # Install PM2 globally
              sudo npm install -g pm2
              
              # Pre-create deployment directory and fix ownership
              sudo mkdir -p /home/ubuntu/api
              sudo chown -R ubuntu:ubuntu /home/ubuntu/api
              EOF

  tags = {
    Name = "my-node-api-instance"
  }
}

# Outputs
output "ec2_public_ip" {
  value       = aws_instance.api_server.public_ip
  description = "The public IP address of the deployed EC2 instance"
}

output "ec2_public_dns" {
  value       = aws_instance.api_server.public_dns
  description = "The public DNS of the deployed EC2 instance"
}
